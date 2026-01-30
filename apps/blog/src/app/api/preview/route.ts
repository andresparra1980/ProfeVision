import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const locale = searchParams.get('locale') || 'es';

    if (!slug) {
        return new Response('Missing slug', { status: 400 });
    }

    // Verify user is authenticated via Payload
    const payload = await getPayloadClient();
    const headers = new Headers(request.headers);
    const { user } = await payload.auth({ headers });

    if (!user) {
        return new Response('Unauthorized - Please login to the admin first', { status: 401 });
    }

    // Enable draft mode
    const draft = await draftMode();
    draft.enable();

    // Redirect to the post with locale
    redirect(`/${locale}/posts/${slug}`);
}
