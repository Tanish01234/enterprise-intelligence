"""Organization management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.services.supabase_auth import verify_supabase_token

router = APIRouter()
security = HTTPBearer()


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    settings: dict
    owner_id: str
    created_at: datetime
    updated_at: datetime


class OrganizationMemberResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: str
    joined_at: datetime


class CreateOrganizationRequest(BaseModel):
    name: str
    slug: Optional[str] = None


class UpdateOrganizationRequest(BaseModel):
    name: Optional[str] = None
    settings: Optional[dict] = None


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "viewer"


@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """List all organizations user is a member of."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Get organization IDs user is a member of
        members_result = supabase.table('organization_members').select('organization_id').eq('user_id', user_id).execute()
        
        if not members_result.data:
            return []
        
        org_ids = [m['organization_id'] for m in members_result.data]
        
        # Get organizations
        orgs_result = supabase.table('organizations').select('*').in_('id', org_ids).execute()
        
        return orgs_result.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list organizations: {str(e)}"
        )


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    request: CreateOrganizationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Create a new organization."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Generate slug if not provided
        slug = request.slug or request.name.lower().replace(' ', '-')
        
        # Create organization
        org_data = {
            'name': request.name,
            'slug': slug,
            'owner_id': user_id,
            'settings': {"timezone": "UTC", "currency": "USD", "fiscal_year_start": 1}
        }
        
        org_result = supabase.table('organizations').insert(org_data).execute()
        
        if not org_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create organization"
            )
        
        organization = org_result.data[0]
        
        # Add creator as owner member
        member_data = {
            'organization_id': organization['id'],
            'user_id': user_id,
            'role': 'owner'
        }
        
        supabase.table('organization_members').insert(member_data).execute()
        
        return organization
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organization: {str(e)}"
        )


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Get organization by ID."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Verify user is member
        member_check = supabase.table('organization_members').select('id').eq('organization_id', organization_id).eq('user_id', user_id).execute()
        
        if not member_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this organization"
            )
        
        # Get organization
        org_result = supabase.table('organizations').select('*').eq('id', organization_id).single().execute()
        
        if not org_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        return org_result.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organization: {str(e)}"
        )


@router.put("/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    organization_id: str,
    request: UpdateOrganizationRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Update organization."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Verify user is owner or admin
        member_check = supabase.table('organization_members').select('role').eq('organization_id', organization_id).eq('user_id', user_id).single().execute()
        
        if not member_check.data or member_check.data['role'] not in ['owner', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Build update data
        update_data = {}
        if request.name is not None:
            update_data['name'] = request.name
        if request.settings is not None:
            update_data['settings'] = request.settings
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update organization
        result = supabase.table('organizations').update(update_data).eq('id', organization_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.get("/{organization_id}/members", response_model=List[OrganizationMemberResponse])
async def list_organization_members(
    organization_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """List organization members."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Verify user is member
        member_check = supabase.table('organization_members').select('id').eq('organization_id', organization_id).eq('user_id', user_id).execute()
        
        if not member_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this organization"
            )
        
        # Get members
        members_result = supabase.table('organization_members').select('*').eq('organization_id', organization_id).execute()
        
        return members_result.data or []
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list members: {str(e)}"
        )


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Delete organization (owner only)."""
    
    payload = await verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    
    from app.core.supabase import get_supabase
    supabase = get_supabase()
    
    try:
        # Verify user is owner
        org_result = supabase.table('organizations').select('owner_id').eq('id', organization_id).single().execute()
        
        if not org_result.data or org_result.data['owner_id'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organization owner can delete"
            )
        
        # Delete organization (cascades to members, datasets, etc.)
        supabase.table('organizations').delete().eq('id', organization_id).execute()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organization: {str(e)}"
        )
