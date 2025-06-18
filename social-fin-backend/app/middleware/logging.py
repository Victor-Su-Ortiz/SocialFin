import time
import json
import logging
from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
from datetime import datetime
import uuid

# Configure logger
logger = logging.getLogger("socialfin.api")


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Start timer
        start_time = time.time()

        # Log request
        await self._log_request(request, request_id)

        # Process request
        response = await call_next(request)

        # Calculate duration
        process_time = time.time() - start_time

        # Log response
        await self._log_response(request, response, process_time, request_id)

        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)

        return response

    async def _log_request(self, request: Request, request_id: str):
        """Log incoming request details"""
        # Get request body for POST/PUT/PATCH
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    # Store body for later use by the endpoint
                    async def receive() -> Message:
                        return {"type": "http.request", "body": body_bytes}

                    request._receive = receive

                    # Try to parse as JSON for logging
                    try:
                        body = json.loads(body_bytes)
                        # Mask sensitive fields
                        if isinstance(body, dict):
                            body = self._mask_sensitive_data(body.copy())
                    except json.JSONDecodeError:
                        body = f"<Binary data: {len(body_bytes)} bytes>"
            except Exception as e:
                logger.error(f"Error reading request body: {e}")

        log_data = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client": (
                f"{request.client.host}:{request.client.port}"
                if request.client
                else None
            ),
            "body": body,
        }

        # Remove sensitive headers
        sensitive_headers = ["authorization", "cookie", "x-api-key"]
        for header in sensitive_headers:
            if header in log_data["headers"]:
                log_data["headers"][header] = "***MASKED***"

        logger.info(f"Incoming request: {json.dumps(log_data)}")

    async def _log_response(
        self, request: Request, response: Response, process_time: float, request_id: str
    ):
        """Log response details"""
        log_data = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": f"{process_time:.3f}s",
        }

        # Add user info if available
        if hasattr(request.state, "user_id"):
            log_data["user_id"] = request.state.user_id

        # Log level based on status code
        if response.status_code >= 500:
            logger.error(f"Request failed: {json.dumps(log_data)}")
        elif response.status_code >= 400:
            logger.warning(f"Request rejected: {json.dumps(log_data)}")
        else:
            logger.info(f"Request completed: {json.dumps(log_data)}")

    def _mask_sensitive_data(self, data: dict) -> dict:
        """Mask sensitive fields in request/response data"""
        sensitive_fields = [
            "password",
            "token",
            "secret",
            "api_key",
            "access_token",
            "refresh_token",
            "credit_card",
            "ssn",
            "pin",
        ]

        for field in sensitive_fields:
            if field in data:
                data[field] = "***MASKED***"

        # Recursively mask nested dictionaries
        for key, value in data.items():
            if isinstance(value, dict):
                data[key] = self._mask_sensitive_data(value.copy())

        return data
