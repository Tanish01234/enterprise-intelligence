'use client'

import AppShell from '@/components/shell/AppShell'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return <AppShell currentPath={pathname}>{children}</AppShell>
}
