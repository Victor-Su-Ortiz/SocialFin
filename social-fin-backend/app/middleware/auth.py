from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import security_utils


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract user information from JWT tokens
    and add it to request.state for logging purposes
    """

    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/",
        ]

    async def dispatch(self, request: Request, call_next):
        # Skip auth extraction for excluded paths
        if not any(request.url.path.startswith(path) for path in self.exclude_paths):
            # Try to extract user info from Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    payload = security_utils.decode_token(token)
                    if payload:
                        request.state.user_id = payload.get("sub")
                        request.state.user_email = payload.get("email")
                except Exception:
                    # Invalid token, but don't block the request
                    # The actual auth will be handled by dependencies
                    pass

        response = await call_next(request)
        return response
