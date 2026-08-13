// ──────────────────────────────────────────
// Auth Types
// ──────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName: string
}

// ──────────────────────────────────────────
// Organization Types
// ──────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'analyst' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  settings: OrgSettings
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface OrgSettings {
  timezone: string
  currency: string
  fiscalYearStart: number
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: OrgRole
  joinedAt: string
  invitedBy: string | null
}

export interface CreateOrganizationInput {
  name: string
  slug: string
}

// ──────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────

export interface ApiError {
  detail: string
  status?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
