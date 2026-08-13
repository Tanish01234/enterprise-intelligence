import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build/SSR prerendering, env vars may not be available.
    // Return a stub that won't crash static generation.
    if (typeof window === 'undefined') {
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({ data: {}, error: new Error('Not configured') }),
          signUp: async () => ({ data: {}, error: new Error('Not configured') }),
          signOut: async () => ({ error: null }),
          refreshSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
      } as unknown as ReturnType<typeof createBrowserClient>
    }
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  client = createBrowserClient(supabaseUrl, supabaseKey)
  return client
}