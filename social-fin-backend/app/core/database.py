from typing import Optional
import logging
from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions
from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Singleton class to manage Supabase client connections"""

    def __init__(self):
        self._client: Optional[Client] = None
        self._service_client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """Get the regular Supabase client (with anon key)"""
        if not self._client:
            self._client = create_client(
                settings.supabase_url, settings.supabase_anon_key
            )
        return self._client

    @property
    def service_client(self) -> Client:
        """Get the service role Supabase client (for admin operations)"""
        if not self._service_client:
            self._service_client = create_client(
                settings.supabase_url,
                settings.supabase_service_key,
                options=SyncClientOptions(
                    auto_refresh_token=False, persist_session=False
                ),
            )
        return self._service_client

    async def get_user_client(self, access_token: str) -> Client:
        """Get a Supabase client with user's access token"""
        return create_client(
            settings.supabase_url,
            settings.supabase_anon_key,
            options=SyncClientOptions(
                headers={"Authorization": f"Bearer {access_token}"}
            ),
        )


# Singleton instance
supabase = SupabaseClient()
