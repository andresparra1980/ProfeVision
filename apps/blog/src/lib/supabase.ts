import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Server component, ignore
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Server component, ignore
                    }
                },
            },
        }
    );
}

/**
 * Check if the current user is an admin (subscription_tier = 'admin')
 * Returns the user data if admin, null otherwise
 */
export async function checkAdminAccess() {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profesor } = await supabase
        .from('profesores')
        .select('id, nombres, apellidos, subscription_tier')
        .eq('id', user.id)
        .single();

    if (profesor?.subscription_tier !== 'admin') {
        return null;
    }

    return {
        id: profesor.id,
        email: user.email,
        name: `${profesor.nombres} ${profesor.apellidos}`,
    };
}
