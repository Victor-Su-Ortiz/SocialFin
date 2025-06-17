from fastapi import APIRouter
from app.api.v1 import auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])


# Health check endpoint at API level
@api_router.get("/health", tags=["health"])
async def api_health_check():
    return {"status": "healthy", "service": "SocialFin API v1"}
