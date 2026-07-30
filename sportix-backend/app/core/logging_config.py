"""
Structured logging and per-request correlation ids.

Every log line carries the id of the request that produced it, and the same id
goes out on the X-Request-ID response header and inside error payloads, so a
user-reported failure can be traced to its server-side log line.

The id lives in a ContextVar rather than being threaded through call signatures,
which means service code logs normally and still gets correlated output.
"""
from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar

# Set by RequestIDMiddleware for the lifetime of each request.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


def new_request_id() -> str:
    return uuid.uuid4().hex[:12]


def current_request_id() -> str:
    return request_id_ctx.get()


class RequestIDFilter(logging.Filter):
    """Injects request_id so the formatter can reference it unconditionally."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


def configure_logging(level: str = "INFO") -> None:
    """
    Install a single stderr handler on the root logger.

    Idempotent: re-running (as the test suite does when it re-imports the app)
    replaces the handler instead of stacking duplicates that would print every
    line two or more times.
    """
    root = logging.getLogger()
    root.setLevel(level.upper())

    for existing in root.handlers[:]:
        root.removeHandler(existing)

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        fmt="%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    ))
    handler.addFilter(RequestIDFilter())
    root.addHandler(handler)

    # uvicorn installs its own handlers; let them propagate to ours instead so
    # access and application logs share one format and one request id.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True

    # Third-party request loggers are chatty at INFO and would double-report
    # every call the app already logs once.
    for noisy in ("httpx", "httpcore", "urllib3", "py.warnings"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Route warnings.warn() through logging so the Appwrite SDK's deprecation
    # notices stop going straight to stderr unformatted.
    logging.captureWarnings(True)
