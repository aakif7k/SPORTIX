from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from appwrite.exception import AppwriteException


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppwriteException)
    async def appwrite_handler(request: Request, exc: AppwriteException):
        return JSONResponse(
            status_code=exc.code or 500,
            content={"success": False, "error": {"code": "APPWRITE_ERROR", "message": exc.message}},
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
        )

    @app.exception_handler(PermissionError)
    async def permission_handler(request: Request, exc: PermissionError):
        return JSONResponse(
            status_code=403,
            content={"success": False, "error": {"code": "FORBIDDEN", "message": str(exc)}},
        )

    @app.exception_handler(FileNotFoundError)
    async def not_found_handler(request: Request, exc: FileNotFoundError):
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": {"code": "NOT_FOUND", "message": str(exc)}},
        )
