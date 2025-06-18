from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    BackgroundTasks,
)

from typing import Optional
from app.schemas.auth import (
    Token,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
    PasswordReset,
    PasswordChange,
    EmailVerification,
)
from app.services.auth import AuthService
from app.dependencies import get_current_user
from app.models.user import User
from fastapi.responses import HTMLResponse
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    InvalidTokenError,
)

router = APIRouter(prefix="/auth", tags=["authentication"])
auth_service = AuthService()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    """
    Register a new user

    - **email**: Valid email address
    - **password**: Minimum 8 characters with at least 1 uppercase, 1 lowercase, and 1 digit
    - **first_name**: User's first name
    - **last_name**: User's last name (optional)
    - **phone**: Phone number (optional)
    """
    try:
        print("Registering user:", user_data.email)
        tokens = await auth_service.register(user_data)

        # Send welcome email in background
        # background_tasks.add_task(send_welcome_email, user_data.email, user_data.first_name)

        return tokens
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again.",
        ) from e


@router.post("/login", response_model=Token)
async def login(
    # form_data: Optional[OAuth2PasswordRequestForm] = Depends(),
    json_data: Optional[UserLogin] = None,
):
    """
    Login with email and password (supports both form and JSON)
    """
    # if form_data:
    #     # OAuth2 form data (username field contains email)
    #     print("Logging in with form data:", form_data.username)
    #     email = form_data.username
    #     password = form_data.password
    if json_data:
        # JSON data
        print("Logging in with JSON data:", json_data.email)
        email = json_data.email
        password = json_data.password
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No credentials provided"
        )

    try:
        tokens = await auth_service.login(email, password)
        return tokens
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from InvalidCredentialsError


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh):
    """
    Refresh access token using refresh token
    """
    try:
        tokens = await auth_service.refresh_token(token_data.refresh_token)
        return tokens
    except (InvalidTokenError, UserNotFoundError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed.",
        ) from e


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user by invalidating refresh token
    """
    try:
        await auth_service.logout(current_user.id)
    except Exception as e:
        # Even if logout fails, we return success to the client
        pass


@router.post("/password/forgot", response_model=dict)
async def forgot_password(email: str, background_tasks: BackgroundTasks):
    """
    Request password reset link
    """
    try:
        message = await auth_service.request_password_reset(email)
        return {"message": message}
    except Exception as e:
        # Always return the same message for security
        return {
            "message": "If an account exists with this email, you will receive a password reset link."
        }


@router.post("/password/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(reset_data: PasswordReset):
    """
    Reset password using reset token
    """
    try:
        await auth_service.reset_password(reset_data.token, reset_data.new_password)
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again.",
        ) from e


@router.post("/password/change", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    password_data: PasswordChange, current_user: User = Depends(get_current_user)
):
    """
    Change password for authenticated user
    """
    try:
        await auth_service.change_password(
            current_user.id, password_data.current_password, password_data.new_password
        )
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed. Please try again.",
        ) from e


@router.post("/email/verify", response_model=dict)
async def verify_email(verification: EmailVerification):
    """
    Verify email address with verification code
    """
    try:
        success = await auth_service.verify_email(verification.email, verification.code)
        if success:
            return {"message": "Email verified successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again.",
        ) from e


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.get("/email-verified", response_class=HTMLResponse)
async def email_verified_page():
    """
    Simple success page to show after email verification
    Users are redirected here after Supabase verifies their email
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - SocialFin</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 20px;
            }
            .card {
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 400px;
                width: 100%;
            }
            .checkmark {
                width: 80px;
                height: 80px;
                margin: 0 auto 2rem;
                background: #10b981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: scaleIn 0.3s ease-out;
            }
            .checkmark svg {
                width: 40px;
                height: 40px;
                stroke: white;
                stroke-width: 3;
            }
            h1 {
                color: #1f2937;
                font-size: 2rem;
                margin: 0 0 1rem;
            }
            p {
                color: #6b7280;
                font-size: 1.1rem;
                line-height: 1.6;
                margin: 0 0 2rem;
            }
            .message {
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 0.5rem;
                color: #4b5563;
                font-size: 0.95rem;
            }
            @keyframes scaleIn {
                from {
                    transform: scale(0);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="checkmark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <div class="message">
                You can now close this window and log in to the SocialFin mobile app.
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
