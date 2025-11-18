import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Check for NextAuth session cookie (authjs.session-token for NextAuth v5)
    const sessionToken = request.cookies.get('authjs.session-token') || 
                         request.cookies.get('__Secure-authjs.session-token');
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

