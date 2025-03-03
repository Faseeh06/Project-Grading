import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow auth logging endpoints to proceed without authentication
  if (request.nextUrl.pathname.startsWith('/api/auth/_log')) {
    return NextResponse.next()
  }

  // ...rest of your middleware logic...
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|favicon.ico).*)',
  ],
}
