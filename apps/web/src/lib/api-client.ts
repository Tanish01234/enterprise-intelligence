/**
 * API Client for Synora Backend
 * Handles all communication with FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token)
      } else {
        localStorage.removeItem('access_token')
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }))
        return {
          success: false,
          error: error.detail || `HTTP ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Auth endpoints
  auth = {
    signUp: (email: string, password: string, fullName?: string) =>
      this.request('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      }),

    signIn: (email: string, password: string) =>
      this.request('/api/v1/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    signOut: () =>
      this.request('/api/v1/auth/signout', {
        method: 'POST',
      }),

    getCurrentUser: () => this.request('/api/v1/auth/me'),

    refreshToken: (refreshToken: string) =>
      this.request('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
  }

  // Datasets endpoints
  datasets = {
    list: (skip = 0, limit = 100) =>
      this.request(`/api/v1/datasets?skip=${skip}&limit=${limit}`),

    get: (id: string) => this.request(`/api/v1/datasets/${id}`),

    upload: async (file: File, name?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      if (name) formData.append('name', name)

      const headers: HeadersInit = {}
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.baseURL}/api/v1/datasets/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
        return { success: false, error: error.detail }
      }

      const data = await response.json()
      return { success: true, data }
    },

    delete: (id: string) =>
      this.request(`/api/v1/datasets/${id}`, {
        method: 'DELETE',
      }),

    preview: (id: string, limit = 100) =>
      this.request(`/api/v1/datasets/${id}/preview?limit=${limit}`),

    exportCsv: async (id: string) => {
      const headers: HeadersInit = {}
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      try {
        const response = await fetch(`${this.baseURL}/api/v1/datasets/${id}/export/csv`, {
          method: 'GET',
          headers,
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: 'Export failed' }))
          return { success: false, error: error.detail }
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dataset-${id}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Export failed'
        }
      }
    },
  }

  // Analytics endpoints
  analytics = {
    executeSql: (datasetId: string, sql: string) =>
      this.request('/api/v1/analytics/query/sql', {
        method: 'POST',
        body: JSON.stringify({ dataset_id: datasetId, sql }),
      }),

    executeNaturalLanguage: (datasetId: string, question: string) =>
      this.request('/api/v1/analytics/query/natural-language', {
        method: 'POST',
        body: JSON.stringify({ dataset_id: datasetId, question }),
      }),

    aggregate: (datasetId: string, aggregations: any[], groupBy?: string[], filters?: any[]) =>
      this.request('/api/v1/analytics/aggregate', {
        method: 'POST',
        body: JSON.stringify({
          dataset_id: datasetId,
          aggregations,
          group_by: groupBy,
          filters,
        }),
      }),

    calculateKpis: (datasetId: string, kpis: any[]) =>
      this.request('/api/v1/analytics/kpis', {
        method: 'POST',
        body: JSON.stringify({ dataset_id: datasetId, kpis }),
      }),

    generateTimeSeries: (
      datasetId: string,
      dateColumn: string,
      valueColumn: string,
      aggregation = 'sum',
      interval = 'day'
    ) =>
      this.request('/api/v1/analytics/time-series', {
        method: 'POST',
        body: JSON.stringify({
          dataset_id: datasetId,
          date_column: dateColumn,
          value_column: valueColumn,
          aggregation,
          interval,
        }),
      }),

    listQueries: (skip = 0, limit = 100) =>
      this.request(`/api/v1/analytics/queries?skip=${skip}&limit=${limit}`),
  }

  // AI Copilot endpoints
  ai = {
    createConversation: (title?: string, context?: any) =>
      this.request('/api/v1/ai/conversations', {
        method: 'POST',
        body: JSON.stringify({ title, context }),
      }),

    listConversations: (skip = 0, limit = 100) =>
      this.request(`/api/v1/ai/conversations?skip=${skip}&limit=${limit}`),

    getConversation: (id: string) => this.request(`/api/v1/ai/conversations/${id}`),

    getMessages: (conversationId: string) =>
      this.request(`/api/v1/ai/conversations/${conversationId}/messages`),

    sendMessage: (conversationId: string, content: string) =>
      this.request(`/api/v1/ai/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  }

  // Organizations endpoints
  organizations = {
    list: (skip = 0, limit = 100) =>
      this.request(`/api/v1/organizations?skip=${skip}&limit=${limit}`),

    get: (id: string) => this.request(`/api/v1/organizations/${id}`),

    create: (name: string, slug?: string) =>
      this.request('/api/v1/organizations', {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      }),

    update: (id: string, data: any) =>
      this.request(`/api/v1/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request(`/api/v1/organizations/${id}`, {
        method: 'DELETE',
      }),

    listMembers: (id: string) =>
      this.request(`/api/v1/organizations/${id}/members`),
  }

  // Profiles endpoints
  profiles = {
    me: () => this.request('/api/v1/profiles/me'),
    
    getMe: () => this.request('/api/v1/profiles/me'),

    update: (data: any) =>
      this.request('/api/v1/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    updateMe: (data: any) =>
      this.request('/api/v1/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    completeOnboarding: (data: any) =>
      this.request('/api/v1/profiles/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    onboardingStatus: () =>
      this.request('/api/v1/profiles/onboarding-status'),
  }

  // Health check
  health = () => this.request('/health')

  // Demo Mode endpoints
  demo = {
    dashboardKpis: () => this.request('/api/v1/demo/dashboard/kpis'),
    
    revenueTrend: () => this.request('/api/v1/demo/dashboard/revenue-trend'),
    
    activity: () => this.request('/api/v1/demo/dashboard/activity'),
    
    regions: () => this.request('/api/v1/demo/analytics/regions'),
    
    industries: () => this.request('/api/v1/demo/analytics/industries'),
    
    products: () => this.request('/api/v1/demo/analytics/products'),
    
    yearComparison: () => this.request('/api/v1/demo/analytics/year-comparison'),
    
    datasetInfo: () => this.request('/api/v1/demo/datasets/demo'),
    
    aiQuery: (question: string) => this.request('/api/v1/demo/ai/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
