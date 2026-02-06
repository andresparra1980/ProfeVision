import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Create next-intl middleware for locale handling
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip locale middleware for Payload routes - Payload handles its own auth
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // For all other routes, apply next-intl middleware for locale handling
    return intlMiddleware(request);
}

export const config = {
    // Match all paths except static files, api routes, and admin
    matcher: ['/((?!_next|api|admin|.*\\..*).*)']
}; 
