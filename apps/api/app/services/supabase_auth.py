"""Supabase authentication service."""

import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)


async def verify_supabase_token(access_token: str) -> Dict[str, Any]:
    """Verify Supabase access token and return user info."""
    try:
        supabase = get_supabase()
        response = supabase.auth.get_user(access_token)
        
        if response.user:
            return {
                "sub": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata
            }
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


class SupabaseAuthService:
    """Supabase authentication service."""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    async def sign_up(
        self,
        email: str,
        password: str,
        user_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Sign up new user with Supabase."""
        try:
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": user_metadata or {}
                }
            })
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token if response.session else None,
                        "refresh_token": response.session.refresh_token if response.session else None
                    }
                }
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sign up failed"
            )
            
        except Exception as e:
            logger.error(f"Sign up error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Sign up failed: {str(e)}"
            )
    
    async def sign_in(
        self,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        """Sign in user with Supabase."""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user and response.session:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at
                    }
                }
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
        except Exception as e:
            logger.error(f"Sign in error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
    async def sign_out(self, access_token: str) -> Dict[str, Any]:
        """Sign out user."""
        try:
            self.supabase.auth.sign_out()
            return {"success": True, "message": "Signed out successfully"}
            
        except Exception as e:
            logger.error(f"Sign out error: {e}")
            return {"success": False, "error": str(e)}
    
    async def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh user session."""
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            
            if response.session:
                return {
                    "success": True,
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at
                    }
                }
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
        except Exception as e:
            logger.error(f"Refresh token error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    async def get_user(self, access_token: str) -> Dict[str, Any]:
        """Get user from access token."""
        try:
            response = self.supabase.auth.get_user(access_token)
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata,
                        "created_at": response.user.created_at
                    }
                }
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token"
            )
            
        except Exception as e:
            logger.error(f"Get user error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token"
            )
    
    async def reset_password_email(self, email: str) -> Dict[str, Any]:
        """Send password reset email."""
        try:
            self.supabase.auth.reset_password_for_email(email)
            return {
                "success": True,
                "message": "Password reset email sent"
            }
            
        except Exception as e:
            logger.error(f"Password reset error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_user(
        self,
        access_token: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user profile."""
        try:
            response = self.supabase.auth.update_user(access_token, updates)
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata
                    }
                }
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update failed"
            )
            
        except Exception as e:
            logger.error(f"Update user error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Update failed: {str(e)}"
            )
    
    async def sign_in_with_oauth(
        self,
        provider: str,
        redirect_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sign in with OAuth provider (Google, GitHub, etc.)."""
        try:
            response = self.supabase.auth.sign_in_with_oauth({
                "provider": provider,
                "options": {
                    "redirect_to": redirect_to or "http://localhost:3000/auth/callback"
                }
            })
            
            return {
                "success": True,
                "url": response.url
            }
            
        except Exception as e:
            logger.error(f"OAuth error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth sign in failed: {str(e)}"
            )


# Global auth service instance
supabase_auth_service = SupabaseAuthService()
