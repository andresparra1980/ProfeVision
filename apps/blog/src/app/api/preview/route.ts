import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { checkAdminAccess } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const secret = searchParams.get('secret');
    const locale = searchParams.get('locale') || 'es';

    // Validate secret
    if (secret !== process.env.PREVIEW_SECRET) {
        return new Response('Invalid secret', { status: 401 });
    }

    // Check if user is admin
    const admin = await checkAdminAccess();
    if (!admin) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (!slug) {
        return new Response('Missing slug', { status: 400 });
    }

    // Enable draft mode
    const draft = await draftMode();
    draft.enable();

    // Redirect to the post with locale
    redirect(`/${locale}/posts/${slug}`);
}
