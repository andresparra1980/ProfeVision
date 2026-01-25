import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Create next-intl middleware for locale handling
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip locale middleware for Payload routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
        // For /admin routes, protect with Supabase auth
        if (pathname.startsWith('/admin')) {
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        get(name: string) {
                            return request.cookies.get(name)?.value;
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            // Setting cookies in middleware requires response manipulation
                        },
                        remove(name: string, options: CookieOptions) {
                            // Removing cookies in middleware requires response manipulation
                        },
                    },
                }
            );

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Silent redirect to default locale homepage
                return NextResponse.redirect(new URL('/es', request.url));
            }

            // Check if user is admin
            const { data: profesor } = await supabase
                .from('profesores')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (profesor?.subscription_tier !== 'admin') {
                // Silent redirect to default locale homepage
                return NextResponse.redirect(new URL('/es', request.url));
            }
        }

        return NextResponse.next();
    }

    // For all other routes, apply next-intl middleware for locale handling
    return intlMiddleware(request);
}

export const config = {
    // Match all paths except static files and api routes
    matcher: ['/((?!_next|.*\\..*).*)'],
};

