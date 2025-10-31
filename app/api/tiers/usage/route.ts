import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import TierService from '@/lib/services/tier-service';
import logger from '@/lib/utils/logger';

/**
 * GET /api/tiers/usage
 * Get usage statistics for the authenticated teacher
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

    // Get usage statistics
    const usageStats = await TierService.getUsageStats(user.id);

    return NextResponse.json({
      success: true,
      data: usageStats,
    });
  } catch (error) {
    logger.error('Error in GET /api/tiers/usage:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
