"""
The single error shape for the whole API.

Success responses are {"success": true, "data": ...}; failures are
{"success": false, "error": {"code", "message", "details"}} plus the request id,
so a client can always branch on `success` and quote an id when reporting a bug.

The catch-all handler is the important one: it logs a traceback server-side and
returns a generic message, so an unexpected Appwrite or Python error can never
leak collection names, queries or stack frames to a browser.
"""
from __future__ import annotations

import logging

from appwrite.exception import AppwriteException
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging_config import current_request_id

logger = logging.getLogger(__name__)


def error_body(code: str, message: str, details=None) -> dict:
    body: dict = {
        "success": False,
        "error": {"code": code, "message": message, "details": details},
        "request_id": current_request_id(),
    }
    return body


def error_response(status: int, code: str, message: str, details=None) -> JSONResponse:
    return JSONResponse(status_code=status, content=error_body(code, message, details))


# HTTP status -> stable machine-readable code, so clients branch on code not prose.
_HTTP_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
}


def register_exception_handlers(app: FastAPI) -> None:
    # Imported here rather than at module scope: app.services imports app.core, so
    # a top-level import would be circular.
    from app.services.ai_service import AIUnavailable


    @app.exception_handler(StarletteHTTPException)
    async def http_handler(request: Request, exc: StarletteHTTPException):
        code = _HTTP_CODES.get(exc.status_code, "HTTP_ERROR")
        return error_response(exc.status_code, code, str(exc.detail))

    @app.exception_handler(AIUnavailable)
    async def ai_unavailable_handler(request: Request, exc: AIUnavailable):
        # 503, not 500: the server is fine, the optional AI dependency is simply
        # not configured. A 500 told the client something had broken and made a
        # missing key look like a bug.
        return error_response(
            503, "AI_UNAVAILABLE",
            str(exc) or "The AI service is not configured on this server.",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        # Field-level detail is safe to return and is what makes a 422 actionable.
        details = [
            {
                "field": ".".join(str(p) for p in err.get("loc", []) if p != "body"),
                "message": err.get("msg"),
                "type": err.get("type"),
            }
            for err in exc.errors()
        ]
        return error_response(422, "VALIDATION_ERROR", "Request validation failed", details)

    @app.exception_handler(AppwriteException)
    async def appwrite_handler(request: Request, exc: AppwriteException):
        status = getattr(exc, "code", 500) or 500
        # Appwrite uses 0 for transport-level problems, which is not a valid
        # HTTP status and would make Starlette raise while responding.
        if not isinstance(status, int) or not 400 <= status <= 599:
            status = 502
        logger.warning(
            "Appwrite error on %s %s: %s (code=%s type=%s)",
            request.method, request.url.path, exc.message,
            getattr(exc, "code", None), getattr(exc, "type", None),
        )
        if status >= 500:
            # Upstream internals must not reach the client.
            return error_response(status, "UPSTREAM_ERROR", "A backend service is unavailable.")
        return error_response(status, "APPWRITE_ERROR", str(exc.message))

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return error_response(400, "VALIDATION_ERROR", str(exc))

    @app.exception_handler(PermissionError)
    async def permission_handler(request: Request, exc: PermissionError):
        return error_response(403, "FORBIDDEN", str(exc) or "Not permitted.")

    @app.exception_handler(FileNotFoundError)
    async def not_found_handler(request: Request, exc: FileNotFoundError):
        return error_response(404, "NOT_FOUND", str(exc) or "Not found.")

    @app.exception_handler(Exception)
    async def catch_all_handler(request: Request, exc: Exception):
        logger.exception(
            "Unhandled %s on %s %s", type(exc).__name__, request.method, request.url.path
        )
        # The real message is in the log, keyed by request id. Outside production
        # include the type to make local debugging less painful.
        message = (
            "An unexpected error occurred."
            if settings.is_production
            else f"An unexpected error occurred ({type(exc).__name__})."
        )
        return error_response(500, "INTERNAL_ERROR", message)
