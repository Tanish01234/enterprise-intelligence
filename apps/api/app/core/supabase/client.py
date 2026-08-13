from supabase import create_client, Client
from app.core.config import settings

# Service role client - NEVER expose to frontend
# Used for admin operations, RLS bypass, server-side auth validation
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)

# Anon client - safe for operations that respect RLS
# Used when we want RLS to be enforced
supabase_anon: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY,
)


def get_supabase_admin() -> Client:
    """Get the Supabase admin client (service role)."""
    return supabase_admin


def get_supabase_anon() -> Client:
    """Get the Supabase anon client (public key)."""
    return supabase_anon