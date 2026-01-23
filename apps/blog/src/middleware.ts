import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect admin routes
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
            // Silent redirect to root - don't reveal admin panel exists
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check if user is admin
        const { data: profesor } = await supabase
            .from('profesores')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

        if (profesor?.subscription_tier !== 'admin') {
            // Silent redirect to root
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
