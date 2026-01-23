import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/supabase';

/**
 * Middleware for admin routes
 * Silently redirects non-admins to homepage
 */
export async function adminGuard() {
    const admin = await checkAdminAccess();

    if (!admin) {
        // Silent redirect - no error message to hide admin panel existence
        redirect('/');
    }

    return admin;
}
