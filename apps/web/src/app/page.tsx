import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

// Force dynamic rendering — Supabase auth requires request cookies
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
