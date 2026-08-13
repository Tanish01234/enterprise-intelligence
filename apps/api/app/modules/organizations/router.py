from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List
from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, get_current_organization, RequireAdmin, RequireOwner
from app.modules.auth.models import Organization, OrganizationMember, OrganizationRole
from app.modules.auth.schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberResponse,
    OrganizationMemberCreate,
    OrganizationMemberUpdate,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new organization. The current user becomes the owner."""
    # Check if slug is already taken
    existing = await session.execute(
        select(Organization).where(Organization.slug == org_data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already exists",
        )

    # Create organization
    org = Organization(
        name=org_data.name,
        slug=org_data.slug,
        owner_id=current_user.id,
    )
    session.add(org)
    await session.flush()

    # Add creator as owner member
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role=OrganizationRole.OWNER,
    )
    session.add(membership)
    await session.commit()
    await session.refresh(org)

    return OrganizationResponse.model_validate(org)


@router.get("", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all organizations the current user is a member of."""
    result = await session.execute(
        select(Organization)
        .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == current_user.id)
        .order_by(Organization.created_at)
    )
    orgs = result.scalars().all()
    return [OrganizationResponse.model_validate(org) for org in orgs]


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get organization by ID. User must be a member."""
    result = await session.execute(
        select(Organization)
        .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
        .where(Organization.id == org_id, OrganizationMember.user_id == current_user.id)
    )
    org = result.scalar_one_or_none()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or access denied",
        )
    
    return OrganizationResponse.model_validate(org)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    membership = Depends(RequireAdmin),
    session: AsyncSession = Depends(get_session),
):
    """Update organization. Requires admin or owner role."""
    org = membership.organization
    
    if org_data.name is not None:
        org.name = org_data.name
    if org_data.settings is not None:
        org.settings = org_data.settings
    
    await session.commit()
    await session.refresh(org)
    
    return OrganizationResponse.model_validate(org)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: UUID,
    membership = Depends(RequireOwner),
    session: AsyncSession = Depends(get_session),
):
    """Delete organization. Requires owner role."""
    org = membership.organization
    await session.delete(org)
    await session.commit()


# Organization Members
@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
async def list_members(
    org_id: UUID,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all members of an organization. User must be a member."""
    # Verify membership
    member_check = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization",
        )

    result = await session.execute(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == org_id)
        .order_by(OrganizationMember.joined_at)
    )
    members = result.scalars().all()
    return [OrganizationMemberResponse.model_validate(m) for m in members]


@router.post("/{org_id}/members", response_model=OrganizationMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    org_id: UUID,
    member_data: OrganizationMemberCreate,
    membership = Depends(RequireAdmin),
    session: AsyncSession = Depends(get_session),
):
    """Add a member to the organization. Requires admin or owner role."""
    org = membership.organization
    
    # Check if user is already a member
    existing = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == member_data.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this organization",
        )

    # Only owner can assign owner role
    if member_data.role == OrganizationRole.OWNER and membership.role != OrganizationRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owner can assign owner role",
        )

    new_member = OrganizationMember(
        organization_id=org_id,
        user_id=member_data.user_id,
        role=member_data.role,
        invited_by=membership.user_id,
    )
    session.add(new_member)
    await session.commit()
    await session.refresh(new_member)
    
    return OrganizationMemberResponse.model_validate(new_member)


@router.patch("/{org_id}/members/{user_id}", response_model=OrganizationMemberResponse)
async def update_member(
    org_id: UUID,
    user_id: UUID,
    member_data: OrganizationMemberUpdate,
    membership = Depends(RequireAdmin),
    session: AsyncSession = Depends(get_session),
):
    """Update a member's role. Requires admin or owner role."""
    # Cannot change own role
    if user_id == membership.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
        )
    )
    target_member = result.scalar_one_or_none()
    
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Only owner can assign/remove owner role
    if member_data.role == OrganizationRole.OWNER and membership.role != OrganizationRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owner can assign owner role",
        )
    if target_member.role == OrganizationRole.OWNER and membership.role != OrganizationRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owner can change owner role",
        )

    target_member.role = member_data.role
    await session.commit()
    await session.refresh(target_member)
    
    return OrganizationMemberResponse.model_validate(target_member)


@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: UUID,
    user_id: UUID,
    membership = Depends(RequireAdmin),
    session: AsyncSession = Depends(get_session),
):
    """Remove a member from the organization. Requires admin or owner role."""
    # Cannot remove self
    if user_id == membership.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself. Transfer ownership first.",
        )

    result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
        )
    )
    target_member = result.scalar_one_or_none()
    
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Only owner can remove owner
    if target_member.role == OrganizationRole.OWNER and membership.role != OrganizationRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owner can remove owner",
        )

    await session.delete(target_member)
    await session.commit()