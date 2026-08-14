"""Supabase client configuration."""

from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase client wrapper."""
    
    def __init__(self):
        self.client: Client = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Supabase client."""
        try:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
                logger.warning("Supabase credentials not configured")
                return
            
            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
    
    def get_client(self) -> Client:
        """Get Supabase client instance."""
        if not self.client:
            self._initialize()
        return self.client
    
    async def verify_connection(self) -> bool:
        """Verify Supabase connection."""
        try:
            if not self.client:
                return False
            
            # Try a simple query
            response = self.client.table('_health').select("*").limit(1).execute()
            return True
            
        except Exception as e:
            logger.error(f"Supabase connection verification failed: {e}")
            return False


# Global Supabase client instance
supabase_client = SupabaseClient()


def get_supabase() -> Client:
    """Dependency to get Supabase client."""
    return supabase_client.get_client()
