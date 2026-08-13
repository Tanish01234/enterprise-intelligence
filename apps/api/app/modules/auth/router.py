from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.core.config import settings
from app.core.database import get_session
from app.core.supabase.client import get_supabase_admin, get_supabase_anon
from app.modules.auth.dependencies import get_current_user, get_auth_context
from app.modules.auth.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    SessionResponse,
    AuthContext,
    AuthErrorResponse,
)
from app.modules.auth.models import UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session),
):
    """Register a new user."""
    supabase = get_supabase_admin()
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": user_data.full_name,
            },
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )

        # Create profile in our database
        profile = UserProfile(
            id=UUID(auth_response.user.id),
            full_name=user_data.full_name,
            avatar_url=auth_response.user.user_metadata.get("avatar_url"),
        )
        session.add(profile)
        await session.commit()

        # Create session for the new user
        sign_in_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })

        return TokenResponse(
            access_token=sign_in_response.session.access_token,
            refresh_token=sign_in_response.session.refresh_token,
            expires_in=sign_in_response.session.expires_in,
            user=UserResponse(
                id=UUID(auth_response.user.id),
                email=auth_response.user.email,
                full_name=user_data.full_name,
                avatar_url=auth_response.user.user_metadata.get("avatar_url"),
                created_at=profile.created_at,
            ),
        )
    except Exception as e:
        await session.rollback()
        # Check if user already exists
        if "already registered" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    session: AsyncSession = Depends(get_session),
):
    """Login with email and password."""
    supabase = get_supabase_admin()
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })

        if not auth_response.session or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Ensure profile exists
        result = await session.execute(
            select(UserProfile).where(UserProfile.id == UUID(auth_response.user.id))
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = UserProfile(
                id=UUID(auth_response.user.id),
                full_name=auth_response.user.user_metadata.get("full_name"),
                avatar_url=auth_response.user.user_metadata.get("avatar_url"),
            )
            session.add(profile)
            await session.commit()
            await session.refresh(profile)

        return TokenResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            expires_in=auth_response.session.expires_in,
            user=UserResponse(
                id=UUID(auth_response.user.id),
                email=auth_response.user.email,
                full_name=profile.full_name,
                avatar_url=profile.avatar_url,
                created_at=profile.created_at,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
        )


@router.post("/logout")
async def logout(
    response: Response,
    credentials: HTTPBearer = Depends(security),
):
    """Logout - invalidate session on Supabase."""
    supabase = get_supabase_admin()
    
    if credentials:
        try:
            supabase.auth.sign_out(credentials.credentials)
        except Exception:
            pass  # Ignore logout errors
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
):
    """Get current authenticated user."""
    return current_user


@router.post("/session", response_model=SessionResponse)
async def create_session(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Create a session from a refresh token (for token refresh)."""
    supabase = get_supabase_admin()
    
    body = await request.json()
    refresh_token = body.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required",
        )
    
    try:
        auth_response = supabase.auth.refresh_session(refresh_token)
        
        if not auth_response.session or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Ensure profile exists
        result = await session.execute(
            select(UserProfile).where(UserProfile.id == UUID(auth_response.user.id))
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = UserProfile(
                id=UUID(auth_response.user.id),
                full_name=auth_response.user.user_metadata.get("full_name"),
                avatar_url=auth_response.user.user_metadata.get("avatar_url"),
            )
            session.add(profile)
            await session.commit()
            await session.refresh(profile)

        return SessionResponse(
            user=UserResponse(
                id=UUID(auth_response.user.id),
                email=auth_response.user.email,
                full_name=profile.full_name,
                avatar_url=profile.avatar_url,
                created_at=profile.created_at,
            ),
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            expires_in=auth_response.session.expires_in,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session refresh failed: {str(e)}",
        )


@router.get("/context", response_model=AuthContext)
async def get_auth_context_endpoint(
    auth_context: AuthContext = Depends(get_auth_context),
):
    """Get full authentication context including organization and membership."""
    return auth_context