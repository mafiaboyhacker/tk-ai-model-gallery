import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 개발 환경에서 CORS 및 네트워크 접근 허용
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next()

    // 모든 브라우저에서 네트워크 접근 허용
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // 브라우저 호환성 헤더
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    // 개발 모드 캐시 무효화 (모든 브라우저 호환)
    if (request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname === '/') {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 모든 요청 경로에 적용하되 다음 제외:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}