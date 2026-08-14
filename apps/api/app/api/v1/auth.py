"""Authentication API endpoints with Supabase integration."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from app.services.supabase_auth import supabase_auth_service

router = APIRouter()
security = HTTPBearer()


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class OAuthSignInRequest(BaseModel):
    provider: str  # google, github, etc.
    redirect_to: Optional[str] = None


@router.post("/signup")
async def sign_up(request: SignUpRequest):
    """Register new user with Supabase."""
    
    user_metadata = {}
    if request.full_name:
        user_metadata["full_name"] = request.full_name
    if request.organization_name:
        user_metadata["organization_name"] = request.organization_name
    
    result = await supabase_auth_service.sign_up(
        email=request.email,
        password=request.password,
        user_metadata=user_metadata
    )
    
    return result


@router.post("/signin")
async def sign_in(request: SignInRequest):
    """Sign in user with email and password."""
    
    # Check for demo account
    if request.email == "demo@synora.ai" and request.password == "Synora@2026":
        # Return demo user session without Supabase
        return {
            "success": True,
            "user": {
                "id": "demo-user-00000000-0000-0000-0000-000000000001",
                "email": "demo@synora.ai",
                "full_name": "Demo User",
                "user_metadata": {
                    "full_name": "Demo User",
                    "company_name": "Synora Demo Corp",
                    "job_title": "Analytics Manager",
                    "is_demo": True
                }
            },
            "session": {
                "access_token": "DEMO_ACCESS_TOKEN_SYNORA_2026",
                "refresh_token": "DEMO_REFRESH_TOKEN_SYNORA_2026",
                "expires_in": 604800,  # 7 days
                "token_type": "bearer"
            },
            "is_demo": True
        }
    
    result = await supabase_auth_service.sign_in(
        email=request.email,
        password=request.password
    )
    
    return result


@router.post("/signout")
async def sign_out(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Sign out current user."""
    
    result = await supabase_auth_service.sign_out(
        access_token=credentials.credentials
    )
    
    return result


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token."""
    
    result = await supabase_auth_service.refresh_session(
        refresh_token=request.refresh_token
    )
    
    return result


@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user."""
    
    result = await supabase_auth_service.get_user(
        access_token=credentials.credentials
    )
    
    return result


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Send password reset email."""
    
    result = await supabase_auth_service.reset_password_email(
        email=request.email
    )
    
    return result


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update user profile."""
    
    updates = {}
    
    if request.full_name is not None:
        updates["data"] = {"full_name": request.full_name}
    
    if request.avatar_url is not None:
        if "data" not in updates:
            updates["data"] = {}
        updates["data"]["avatar_url"] = request.avatar_url
    
    if request.metadata is not None:
        if "data" not in updates:
            updates["data"] = {}
        updates["data"].update(request.metadata)
    
    result = await supabase_auth_service.update_user(
        access_token=credentials.credentials,
        updates=updates
    )
    
    return result


@router.post("/oauth/signin")
async def oauth_sign_in(request: OAuthSignInRequest):
    """Initiate OAuth sign in flow."""
    
    result = await supabase_auth_service.sign_in_with_oauth(
        provider=request.provider,
        redirect_to=request.redirect_to
    )
    
    return result


@router.get("/health")
async def auth_health():
    """Authentication health check."""
    return {
        "status": "healthy",
        "service": "authentication",
        "provider": "supabase"
    }
