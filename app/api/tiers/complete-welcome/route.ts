import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import TierService from '@/lib/services/tier-service';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

/**
 * POST /api/tiers/complete-welcome
 * Mark the welcome flow as completed for the authenticated teacher
 */
export async function POST(req: NextRequest) {
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

    // Mark welcome as completed
    const result = await TierService.completeWelcome(supabase, user.id);

    return NextResponse.json({
      success: result.success,
    });
  } catch (error) {
    logger.error('Error in POST /api/tiers/complete-welcome:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
