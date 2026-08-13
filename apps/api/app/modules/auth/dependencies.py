from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_session
from app.core.supabase.client import get_supabase_admin
from app.modules.auth.models import Organization, OrganizationMember, OrganizationRole, UserProfile
from app.modules.auth.schemas import UserResponse, OrganizationResponse, OrganizationMemberResponse, AuthContext


security = HTTPBearer(auto_error=False)


class AuthCredentials:
    def __init__(self, user_id: UUID, email: str, access_token: str):
        self.user_id = user_id
        self.email = email
        self.access_token = access_token


async def get_current_user_credentials(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthCredentials:
    """Extract and validate Supabase access token from Authorization header."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase = get_supabase_admin()
    
    try:
        # Verify the token with Supabase
        user_response = supabase.auth.get_user(credentials.credentials)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthCredentials(
            user_id=UUID(user_response.user.id),
            email=user_response.user.email,
            access_token=credentials.credentials,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    auth_creds: AuthCredentials = Depends(get_current_user_credentials),
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Get current authenticated user with profile."""
    # Get user profile from our database
    result = await session.execute(
        select(UserProfile).where(UserProfile.id == auth_creds.user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        # Create profile if it doesn't exist (first login)
        profile = UserProfile(id=auth_creds.user_id)
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    return UserResponse(
        id=profile.id,
        email=auth_creds.email,
        full_name=profile.full_name,
        avatar_url=profile.avatar_url,
        created_at=profile.created_at,
    )


async def get_user_organizations(
    user_id: UUID,
    session: AsyncSession,
) -> list[OrganizationResponse]:
    """Get all organizations the user is a member of."""
    result = await session.execute(
        select(Organization)
        .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user_id)
        .order_by(Organization.created_at)
    )
    orgs = result.scalars().all()
    return [OrganizationResponse.model_validate(org) for org in orgs]


async def get_current_organization(
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrganizationResponse:
    """
    Get the current organization for the request.
    
    Priority:
    1. X-Organization-ID header (for API clients)
    2. Active organization from user session/cookie (for web)
    3. First organization if user has only one
    4. None if user has no organizations
    """
    org_id_header = request.headers.get("X-Organization-ID")
    
    user_orgs = await get_user_organizations(current_user.id, session)
    
    if not user_orgs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of any organization",
        )

    if org_id_header:
        try:
            requested_org_id = UUID(org_id_header)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid organization ID format",
            )
        
        # Verify user is member of this organization
        org = next((o for o in user_orgs if o.id == requested_org_id), None)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this organization",
            )
        return org

    # Auto-select if only one organization
    if len(user_orgs) == 1:
        return user_orgs[0]

    # Multiple organizations - require explicit selection
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Multiple organizations found. Please specify X-Organization-ID header.",
    )


async def get_current_membership(
    current_user: UserResponse = Depends(get_current_user),
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
) -> OrganizationMemberResponse:
    """Get the current user's membership in the current organization."""
    result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == current_org.id,
            OrganizationMember.user_id == current_user.id,
        )
    )
    membership = result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of this organization",
        )
    
    return OrganizationMemberResponse.model_validate(membership)


async def get_auth_context(
    current_user: UserResponse = Depends(get_current_user),
    current_org: Optional[OrganizationResponse] = Depends(get_current_organization),
    current_membership: Optional[OrganizationMemberResponse] = Depends(get_current_membership),
) -> AuthContext:
    """Get full authentication context."""
    return AuthContext(
        user=current_user,
        organization=current_org,
        membership=current_membership,
    )


class RequireRole:
    """Dependency class to require specific organization roles."""

    def __init__(self, *allowed_roles: OrganizationRole):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        membership: OrganizationMemberResponse = Depends(get_current_membership),
    ) -> OrganizationMemberResponse:
        if membership.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {[r.value for r in self.allowed_roles]}",
            )
        return membership


def require_role(*allowed_roles: OrganizationRole) -> RequireRole:
    """Dependency factory to require specific organization roles."""
    return RequireRole(*allowed_roles)


# Convenience dependencies
RequireOwner = RequireRole(OrganizationRole.OWNER)
RequireAdmin = RequireRole(OrganizationRole.OWNER, OrganizationRole.ADMIN)
RequireAnalyst = RequireRole(OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.ANALYST)