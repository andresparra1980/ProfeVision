import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import TierService from '@/lib/services/tier-service';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

/**
 * GET /api/tiers/check-welcome
 * Check if the authenticated teacher should see the welcome modal
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    let user;
    try {
      const authResult = await verifyTeacherAuth(req);
      user = authResult.user;
    } catch (_error) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Create Supabase client with user context
    const supabase = createClient();

    // Check if user should see welcome modal
    const showWelcome = await TierService.shouldShowWelcome(supabase, user.id);

    return NextResponse.json({
      success: true,
      showWelcome,
    });
  } catch (error) {
    logger.error('Error in GET /api/tiers/check-welcome:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
