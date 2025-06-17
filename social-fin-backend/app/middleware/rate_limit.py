import time
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import redis.asyncio as redis
from app.config import settings
import json


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        redis_url: Optional[str] = None,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        exclude_paths: Optional[list] = None,
    ):
        super().__init__(app)
        self.redis_url = redis_url or settings.redis_url
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        self._redis_client = None

    async def get_redis_client(self):
        """Get or create Redis client"""
        if not self._redis_client:
            self._redis_client = await redis.from_url(
                self.redis_url, encoding="utf-8", decode_responses=True
            )
        return self._redis_client

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Get client identifier (IP or user ID)
        client_id = self._get_client_id(request)

        # Check rate limits
        try:
            await self._check_rate_limit(client_id, request.url.path)
        except HTTPException as e:
            return Response(
                content=json.dumps(
                    {
                        "detail": e.detail,
                        "retry_after": e.headers.get("Retry-After", "60") if e.headers else "60",
                    }
                ),
                status_code=e.status_code,
                headers=e.headers,
                media_type="application/json",
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        await self._add_rate_limit_headers(client_id, response)

        return response

    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Prefer authenticated user ID
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"

        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        return f"ip:{client_ip}"

    async def _check_rate_limit(self, client_id: str, path: str):
        """Check if client has exceeded rate limits"""
        try:
            redis_client = await self.get_redis_client()

            # Check per-minute limit
            minute_key = f"rate_limit:minute:{client_id}"
            minute_count = await redis_client.incr(minute_key)
            if minute_count == 1:
                await redis_client.expire(minute_key, 60)

            if minute_count > self.requests_per_minute:
                raise HTTPException(
                    status_code=HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {self.requests_per_minute} requests per minute",
                    headers={"Retry-After": "60"},
                )

            # Check per-hour limit
            hour_key = f"rate_limit:hour:{client_id}"
            hour_count = await redis_client.incr(hour_key)
            if hour_count == 1:
                await redis_client.expire(hour_key, 3600)

            if hour_count > self.requests_per_hour:
                raise HTTPException(
                    status_code=HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {self.requests_per_hour} requests per hour",
                    headers={"Retry-After": "3600"},
                )

            # Track endpoint-specific limits for certain paths
            if path.startswith("/api/v1/auth/login"):
                # Stricter limit for login attempts
                login_key = f"rate_limit:login:{client_id}"
                login_count = await redis_client.incr(login_key)
                if login_count == 1:
                    await redis_client.expire(login_key, 300)  # 5 minutes

                if login_count > 5:  # 5 login attempts per 5 minutes
                    raise HTTPException(
                        status_code=HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many login attempts. Please try again later.",
                        headers={"Retry-After": "300"},
                    )

        except redis.RedisError:
            # If Redis is unavailable, allow the request (fail open)
            # But log the error
            import logging

            logging.error("Redis unavailable for rate limiting")
            pass

    async def _add_rate_limit_headers(self, client_id: str, response: Response):
        """Add rate limit information to response headers"""
        try:
            redis_client = await self.get_redis_client()

            minute_key = f"rate_limit:minute:{client_id}"
            hour_key = f"rate_limit:hour:{client_id}"

            minute_count = await redis_client.get(minute_key) or 0
            hour_count = await redis_client.get(hour_key) or 0

            minute_ttl = await redis_client.ttl(minute_key)

            response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Remaining-Minute"] = str(
                max(0, self.requests_per_minute - int(minute_count))
            )
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + minute_ttl)

            response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)
            response.headers["X-RateLimit-Remaining-Hour"] = str(
                max(0, self.requests_per_hour - int(hour_count))
            )

        except redis.RedisError:
            pass
