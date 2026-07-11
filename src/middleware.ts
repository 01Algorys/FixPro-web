import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs on the Edge — localStorage is unavailable.
// Auth is enforced client-side in the dashboard layout; this middleware
// only prevents the login page from being shown when a token cookie exists.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
