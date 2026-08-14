import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value
  const hasOrg = request.cookies.get('has_organization')?.value
  const hasWorkspace = request.cookies.get('has_workspace')?.value
  
  // Public routes
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/login', '/auth/signout', '/demo']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))
  
  // If not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // If authenticated but missing organization setup
  if (token && !hasOrg && !pathname.startsWith('/onboarding/organization') && !isPublicRoute) {
    return NextResponse.redirect(new URL('/onboarding/organization', request.url))
  }
  
  // If has organization but missing workspace setup
  if (token && hasOrg && !hasWorkspace && !pathname.startsWith('/onboarding/workspace') && !isPublicRoute) {
    return NextResponse.redirect(new URL('/onboarding/workspace', request.url))
  }
  
  // If trying to access onboarding when already completed
  if (token && hasOrg && hasWorkspace && pathname.startsWith('/onboarding/')) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }
  
  // If authenticated and trying to access auth pages (except signout)
  if (token && pathname.startsWith('/auth/') && pathname !== '/auth/signout') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
