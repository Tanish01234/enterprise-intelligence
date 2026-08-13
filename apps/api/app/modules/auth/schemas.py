from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.modules.auth.models import OrganizationRole


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class SessionResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    expires_in: int


class OrganizationBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    settings: Optional[dict] = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    settings: dict
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    joined_at: datetime
    invited_by: Optional[UUID] = None


class OrganizationMemberCreate(BaseModel):
    user_id: UUID
    role: OrganizationRole = OrganizationRole.VIEWER


class OrganizationMemberUpdate(BaseModel):
    role: OrganizationRole


class AuthContext(BaseModel):
    user: UserResponse
    organization: Optional[OrganizationResponse] = None
    membership: Optional[OrganizationMemberResponse] = None


class AuthErrorResponse(BaseModel):
    detail: str
    code: str