from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class User:
    """Data class representing a user in the system"""

    id: str
    email: str
    first_name: str
    last_name: Optional[str]
    phone: Optional[str]
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_supabase_user(cls, supabase_user: dict, profile: dict) -> "User":
        """Create User instance from Supabase auth user and profile data"""
        return cls(
            id=supabase_user["id"],
            email=supabase_user["email"],
            first_name=profile.get("first_name", ""),
            last_name=profile.get("last_name"),
            phone=profile.get("phone"),
            is_verified=supabase_user.get("email_confirmed_at") is not None,
            is_active=not supabase_user.get("is_locked", False),
            created_at=datetime.fromisoformat(
                supabase_user["created_at"].replace("Z", "+00:00")
            ),
            updated_at=datetime.fromisoformat(
                profile.get("updated_at", supabase_user["created_at"]).replace(
                    "Z", "+00:00"
                )
            ),
        )
