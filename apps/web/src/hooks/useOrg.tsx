'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'

export interface Organization {
  id: string
  name: string
  slug: string
  settings: {
    timezone: string
    currency: string
    fiscalYearStart: number
  }
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'analyst' | 'viewer'
  joinedAt: string
  invitedBy: string | null
}

interface OrgContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  currentMembership: OrganizationMember | null
  loading: boolean
  setCurrentOrganization: (orgId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
  createOrganization: (name: string, slug: string) => Promise<{ error: Error | null; organization?: Organization }>
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

const ORG_STORAGE_KEY = 'ei_current_org_id'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [currentMembership, setCurrentMembership] = useState<OrganizationMember | null>(null)
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)

  const fetchOrganizations = useCallback(async (): Promise<Organization[]> => {
    if (!session?.access_token) return []

    try {
      const response = await fetch(`${API_BASE}/api/v1/organizations`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
        return data
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
    return []
  }, [session?.access_token])

  const fetchMembership = useCallback(async (orgId: string) => {
    if (!session?.access_token || !user?.id) return

    try {
      const response = await fetch(`${API_BASE}/api/v1/organizations/${orgId}/members`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const members = await response.json()
        const membership = members.find((m: OrganizationMember) => m.userId === user.id)
        setCurrentMembership(membership || null)
      }
    } catch (error) {
      console.error('Failed to fetch membership:', error)
    }
  }, [session?.access_token, user?.id])

  const setCurrentOrganization = useCallback(async (orgId: string) => {
    if (!session?.access_token) return

    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganizationState(org)
      localStorage.setItem(ORG_STORAGE_KEY, orgId)
      await fetchMembership(orgId)
    } else {
      // Org not in list, try fetching it directly
      try {
        const response = await fetch(`${API_BASE}/api/v1/organizations/${orgId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const fetchedOrg = await response.json()
          setCurrentOrganizationState(fetchedOrg)
          localStorage.setItem(ORG_STORAGE_KEY, orgId)
          await fetchMembership(orgId)
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      }
    }
  }, [session?.access_token, organizations, fetchMembership])

  const createOrganization = useCallback(async (name: string, slug: string) => {
    if (!session?.access_token) {
      return { error: new Error('Not authenticated') }
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, slug }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { error: new Error(errorData.detail || 'Failed to create organization') }
      }

      const organization = await response.json()
      setOrganizations(prev => [...prev, organization])
      setCurrentOrganizationState(organization)
      localStorage.setItem(ORG_STORAGE_KEY, organization.id)

      return { error: null, organization }
    } catch (error) {
      return { error: error as Error }
    }
  }, [session?.access_token])

  // Load organizations on auth change — runs once per session
  useEffect(() => {
    if (authLoading) return

    if (!session) {
      setOrganizations([])
      setCurrentOrganizationState(null)
      setCurrentMembership(null)
      setLoading(false)
      initializedRef.current = false
      return
    }

    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      const orgs = await fetchOrganizations()

      const savedOrgId = localStorage.getItem(ORG_STORAGE_KEY)

      if (savedOrgId) {
        const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId)
        if (savedOrg) {
          setCurrentOrganizationState(savedOrg)
          await fetchMembership(savedOrgId)
        } else {
          localStorage.removeItem(ORG_STORAGE_KEY)
          if (orgs.length > 0) {
            setCurrentOrganizationState(orgs[0])
            localStorage.setItem(ORG_STORAGE_KEY, orgs[0].id)
            await fetchMembership(orgs[0].id)
          }
        }
      } else if (orgs.length === 1) {
        setCurrentOrganizationState(orgs[0])
        localStorage.setItem(ORG_STORAGE_KEY, orgs[0].id)
        await fetchMembership(orgs[0].id)
      }

      setLoading(false)
    }

    init()
  }, [authLoading, session, fetchOrganizations, fetchMembership])

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentMembership,
        loading: loading || authLoading,
        setCurrentOrganization,
        refreshOrganizations: async () => { await fetchOrganizations() },
        createOrganization,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}