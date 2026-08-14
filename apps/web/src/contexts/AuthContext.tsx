'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  full_name?: string
  metadata?: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('access_token')
    if (token) {
      apiClient.setToken(token)
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const response = await apiClient.auth.getCurrentUser()
      if (response.success && response.data) {
        const data = response.data as { user: User }
        setUser(data.user)
      } else {
        setUser(null)
        apiClient.setToken(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      apiClient.setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.auth.signIn(email, password)
      
      if (response.success && response.data) {
        const data = response.data as { user: User; session: { access_token: string; refresh_token?: string } }
        setUser(data.user)
        apiClient.setToken(data.session.access_token)
        
        // Store refresh token
        if (data.session.refresh_token) {
          localStorage.setItem('refresh_token', data.session.refresh_token)
        }
        
        return { success: true }
      }
      
      return { success: false, error: response.error || 'Sign in failed' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await apiClient.auth.signUp(email, password, fullName)
      
      if (response.success && response.data) {
        const data = response.data as { user: User; session?: { access_token?: string; refresh_token?: string } }
        setUser(data.user)
        
        if (data.session?.access_token) {
          apiClient.setToken(data.session.access_token)
          
          if (data.session.refresh_token) {
            localStorage.setItem('refresh_token', data.session.refresh_token)
          }
        }
        
        return { success: true }
      }
      
      return { success: false, error: response.error || 'Sign up failed' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      }
    }
  }

  const signOut = async () => {
    try {
      await apiClient.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setUser(null)
      apiClient.setToken(null)
      localStorage.removeItem('refresh_token')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
