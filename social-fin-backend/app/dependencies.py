from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.database import supabase
from app.core.security import security_utils
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode token
        payload = security_utils.decode_token(token)
        if payload is None:
            raise credentials_exception

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        # Verify token type
        if payload.get("type") != "access":
            raise credentials_exception

    except JWTError as exc:
        raise credentials_exception from exc

    # Get user from database
    try:
        user_data = supabase.service_client.auth.admin.get_user_by_id(user_id)
        if not user_data:
            raise credentials_exception

        # Get user profile
        profile_response = (
            supabase.service_client.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not profile_response.data:
            raise credentials_exception

        return User.from_supabase_user(user_data.model_dump(), profile_response.data)

    except Exception as e:
        raise credentials_exception from e


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user (not locked/suspended)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )
    return current_user


async def get_verified_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current verified user (email confirmed)
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address",
        )
    return current_user
