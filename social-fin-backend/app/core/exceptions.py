class AuthException(Exception):
    """Base exception for authentication errors"""

    pass


class UserAlreadyExistsError(AuthException):
    """Raised when attempting to create a user that already exists"""

    pass


class InvalidCredentialsError(AuthException):
    """Raised when login credentials are invalid"""

    pass


class UserNotFoundError(AuthException):
    """Raised when user is not found"""

    pass


class TokenExpiredError(AuthException):
    """Raised when token has expired"""

    pass


class InvalidTokenError(AuthException):
    """Raised when token is invalid"""

    pass


class UnverifiedUserError(AuthException):
    """Raised when user email is not verified"""

    pass


class InactiveUserError(AuthException):
    """Raised when user account is inactive"""

    pass
