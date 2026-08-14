"""User profile API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.services.supabase_auth import verify_supabase_token

router = APIRouter()
security = HTTPBearer()


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str]
    email: str
    company_name: Optional[str]
    job_title: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    avatar_url: Optional[str]
    timezone: str
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None


class CompleteOnboardingRequest(BaseModel):
    full_name: str
    company_name: str
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None


@router.get("/me", response_model=ProfileResponse)
async def get_current_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile."""
    
    # Verify token and get user ID
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    # Query profile from Supabase
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        result = supabase.table('profiles').select('*').eq('user_id', user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )


@router.put("/me", response_model=ProfileResponse)
async def update_current_profile(
    request: UpdateProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile."""
    
    # Verify token and get user ID
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    # Build update data
    update_data = {}
    if request.full_name is not None:
        update_data['full_name'] = request.full_name
    if request.company_name is not None:
        update_data['company_name'] = request.company_name
    if request.job_title is not None:
        update_data['job_title'] = request.job_title
    if request.industry is not None:
        update_data['industry'] = request.industry
    if request.company_size is not None:
        update_data['company_size'] = request.company_size
    if request.avatar_url is not None:
        update_data['avatar_url'] = request.avatar_url
    if request.timezone is not None:
        update_data['timezone'] = request.timezone
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update in Supabase
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        result = supabase.table('profiles').update(update_data).eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data[0]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/complete-onboarding", response_model=ProfileResponse)
async def complete_onboarding(
    request: CompleteOnboardingRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Complete user onboarding."""
    
    # Verify token and get user ID
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    # Update profile with onboarding data
    update_data = {
        'full_name': request.full_name,
        'company_name': request.company_name,
        'onboarding_completed': True
    }
    
    if request.job_title:
        update_data['job_title'] = request.job_title
    if request.industry:
        update_data['industry'] = request.industry
    if request.company_size:
        update_data['company_size'] = request.company_size
    
    # Update in Supabase
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        result = supabase.table('profiles').update(update_data).eq('user_id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return result.data[0]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete onboarding: {str(e)}"
        )


@router.get("/onboarding-status")
async def get_onboarding_status(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Check if user has completed onboarding."""
    
    # Verify token and get user ID
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    # Query profile
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        result = supabase.table('profiles').select('onboarding_completed').eq('user_id', user_id).single().execute()
        
        if not result.data:
            return {"onboarding_completed": False}
        
        return {"onboarding_completed": result.data.get('onboarding_completed', False)}
        
    except Exception as e:
        return {"onboarding_completed": False}
