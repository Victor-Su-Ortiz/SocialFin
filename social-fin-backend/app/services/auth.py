from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from app.core.database import supabase
from app.core.security import security_utils
from app.schemas.auth import UserCreate, Token
from app.config import settings
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    TokenExpiredError,
    InvalidTokenError,
)

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.supabase_client = supabase.client
        self.service_client = supabase.service_client

    async def register(self, user_data: UserCreate) -> Token:
        """Register a new user"""
        try:
            # Check if user already exists
            response = self.service_client.auth.admin.list_users()

            existing_user = [user for user in response if user.email == user_data.email]

            if existing_user and len(existing_user) > 0:
                raise UserAlreadyExistsError("User with this email already exists")

            # Create user in Supabase Auth
            auth_response = self.supabase_client.auth.sign_up(
                {
                    "email": user_data.email,
                    "password": user_data.password,
                    "options": {
                        "data": {
                            "first_name": user_data.first_name,
                            "last_name": user_data.last_name,
                            "phone": user_data.phone,
                        }
                    },
                }
            )

            if auth_response.user:
                # Create user profile
                profile_data = {
                    "id": auth_response.user.id,
                    "email": user_data.email,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "phone": user_data.phone,
                }

                self.service_client.table("user_profiles").insert(
                    profile_data
                ).execute()

                # Generate tokens
                access_token = security_utils.create_access_token(
                    data={"sub": auth_response.user.id, "email": user_data.email}
                )
                refresh_token = security_utils.create_refresh_token(
                    data={"sub": auth_response.user.id}
                )

                # Store refresh token
                await self._store_refresh_token(auth_response.user.id, refresh_token)

                return Token(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expires_in=settings.access_token_expire_minutes * 60,
                )

            raise Exception("Failed to create user")

        except Exception as e:
            logger.error("Registration error: %s", str(e))
            raise

    async def login(self, email: str, password: str) -> Token:
        """Login user with email and password"""
        try:
            # Authenticate with Supabase
            auth_response = self.supabase_client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )

            if not auth_response.user:
                raise InvalidCredentialsError("Invalid email or password")

            # Generate tokens
            access_token = security_utils.create_access_token(
                data={"sub": auth_response.user.id, "email": email}
            )
            refresh_token = security_utils.create_refresh_token(
                data={"sub": auth_response.user.id}
            )

            # Store refresh token
            await self._store_refresh_token(auth_response.user.id, refresh_token)

            return Token(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.access_token_expire_minutes * 60,
            )

        except Exception as e:
            logger.error("Login error: %s", str(e))
            if "Invalid login credentials" in str(e):
                raise InvalidCredentialsError("Invalid email or password") from e
            raise

    async def refresh_token(self, refresh_token: str) -> Token:
        """Refresh access token using refresh token"""
        try:
            # Decode and verify refresh token
            payload = security_utils.decode_token(refresh_token)
            if not payload or payload.get("type") != "refresh":
                raise InvalidTokenError("Invalid refresh token")

            user_id = payload.get("sub")

            if not user_id:
                raise InvalidTokenError("User ID not found in token")

            # Verify refresh token is still valid in database
            stored_token = await self._get_stored_refresh_token(user_id)
            if not stored_token or stored_token != refresh_token:
                raise InvalidTokenError("Refresh token not found or invalid")

            # Get user data
            user_response = self.service_client.auth.admin.get_user_by_id(user_id)
            if not user_response:
                raise UserNotFoundError("User not found")

            user = user_response.user

            # Generate new tokens
            access_token = security_utils.create_access_token(
                data={"sub": user_id, "email": user.email}
            )
            new_refresh_token = security_utils.create_refresh_token(
                data={"sub": user_id}
            )

            # Update stored refresh token
            await self._store_refresh_token(user_id, new_refresh_token)

            return Token(
                access_token=access_token,
                refresh_token=new_refresh_token,
                expires_in=settings.access_token_expire_minutes * 60,
            )

        except Exception as e:
            logger.error("Token refresh error %s", str(e))
            raise

    async def logout(self, user_id: str):
        """Logout user by invalidating refresh token"""
        try:
            await self._delete_refresh_token(user_id)
            # Optionally, add the access token to a blacklist in Redis
        except Exception as e:
            logger.error("Logout error: %s", str(e))
            raise

    async def request_password_reset(self, email: str) -> str:
        """Request password reset for user"""
        try:
            # Check if user exists
            response = self.service_client.auth.admin.list_users()
            user = [user for user in response if user.email == email]

            if not user or len(user) == 0:
                # Don't reveal if user exists or not
                return "If an account exists with this email, you will receive a password reset link."

            # Generate reset token
            reset_token = security_utils.generate_password_reset_token()

            # Store reset token with expiration (1 hour)
            await self._store_password_reset_token(user[0].id, reset_token)

            # TODO: Send email with reset link
            # await send_password_reset_email(email, reset_token)

            return "If an account exists with this email, you will receive a password reset link."

        except Exception as e:
            logger.error("Password reset request error: %s", str(e))
            raise

    async def reset_password(self, token: str, new_password: str):
        """Reset user password with token"""
        try:
            # Verify reset token
            user_id = await self._verify_password_reset_token(token)
            if not user_id:
                raise InvalidTokenError("Invalid or expired reset token")

            # Update password
            self.service_client.auth.admin.update_user_by_id(
                user_id, {"password": new_password}
            )

            # Delete reset token
            await self._delete_password_reset_token(user_id)

            # Invalidate all refresh tokens for security
            await self._delete_refresh_token(user_id)

        except Exception as e:
            logger.error("Password reset error: %s", str(e))
            raise

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ):
        """Change user password"""
        try:
            # Get user email
            user_response = self.service_client.auth.admin.get_user_by_id(user_id)
            if not user_response:
                raise UserNotFoundError("User not found")

            user = user_response.user

            if not user.email:
                raise UserNotFoundError("User email not found")

            # Verify current password
            try:
                self.supabase_client.auth.sign_in_with_password(
                    {"email": user.email, "password": current_password}
                )
            except:
                raise InvalidCredentialsError("Current password is incorrect")

            # Update password
            self.service_client.auth.admin.update_user_by_id(
                user_id, {"password": new_password}
            )

        except Exception as e:
            logger.error("Password change error: %s", str(e))
            raise

    async def verify_email(self, email: str, code: str) -> bool:
        """Verify user email with code"""
        # This would typically be handled by Supabase's built-in email verification
        # but here's a custom implementation if needed
        try:
            stored_code = await self._get_verification_code(email)
            if stored_code and stored_code == code:
                # Mark user as verified
                response = self.service_client.auth.admin.list_users()
                user = [user for user in response if user.email == email]
                if user and len(user) > 0:
                    self.service_client.auth.admin.update_user_by_id(
                        user[0].id,
                        {"email_confirm": True},
                    )
                    await self._delete_verification_code(email)
                    return True
            return False
        except Exception as e:
            logger.error("Email verification error: %s", str(e))
            raise

    # Helper methods for token storage (using Supabase tables or Redis)
    async def _store_refresh_token(self, user_id: str, token: str):
        """Store refresh token in database"""
        # You could create a separate table for this or use Redis
        # For now, storing in user metadata
        self.service_client.auth.admin.update_user_by_id(
            user_id, {"user_metadata": {"refresh_token": token}}
        )

    async def _get_stored_refresh_token(self, user_id: str) -> Optional[str]:
        """Get stored refresh token"""
        user_response = self.service_client.auth.admin.get_user_by_id(user_id)
        user = user_response.user if user_response else None
        if user and user.user_metadata:
            return user.user_metadata.get("refresh_token")
        return None

    async def _delete_refresh_token(self, user_id: str):
        """Delete stored refresh token"""
        self.service_client.auth.admin.update_user_by_id(
            user_id, {"user_metadata": {"refresh_token": None}}
        )

    async def _store_password_reset_token(self, user_id: str, token: str):
        """Store password reset token with expiration"""
        # In production, use Redis or a dedicated table
        expiry = datetime.utcnow() + timedelta(hours=1)
        self.service_client.auth.admin.update_user_by_id(
            user_id,
            {
                "user_metadata": {
                    "reset_token": token,
                    "reset_token_expiry": expiry.isoformat(),
                }
            },
        )

    async def _verify_password_reset_token(self, token: str) -> Optional[str]:
        """Verify password reset token and return user_id if valid"""
        # This is inefficient - in production, use a dedicated table or Redis
        users = self.service_client.auth.admin.list_users()
        for user in users:
            metadata = user.user_metadata or {}
            if metadata.get("reset_token") == token:
                expiry = metadata.get("reset_token_expiry")
                if expiry and datetime.fromisoformat(expiry) > datetime.utcnow():
                    return user.id
        return None

    async def _delete_password_reset_token(self, user_id: str):
        """Delete password reset token"""
        self.service_client.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": {"reset_token": None, "reset_token_expiry": None}},
        )

    async def _get_verification_code(self, email: str) -> Optional[str]:
        """Get verification code for email"""
        # This is a placeholder implementation - in production, use Redis or a dedicated table
        users = self.service_client.auth.admin.list_users()
        for user in users:
            if user.email == email:
                metadata = user.user_metadata or {}
                return metadata.get("verification_code")
        return None

    async def _delete_verification_code(self, email: str):
        """Delete verification code for email"""
        users = self.service_client.auth.admin.list_users()
        for user in users:
            if user.email == email:
                self.service_client.auth.admin.update_user_by_id(
                    user.id,
                    {"user_metadata": {"verification_code": None}},
                )
                break
