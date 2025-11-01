import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import TierService from '@/lib/services/tier-service';
import { createClient } from '@/lib/supabase/server';
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

    // Create Supabase client with user context
    const supabase = createClient();

    // Get usage statistics
    const usageStats = await TierService.getUsageStats(supabase, user.id);

    // Transform to match the frontend interface
    const tierDisplayNames: Record<string, string> = {
      free: 'Free',
      plus: 'Plus',
      admin: 'Admin',
      grandfathered: 'Grandfathered',
    };

    const response = {
      tier: {
        name: usageStats.tier,
        display_name: tierDisplayNames[usageStats.tier] || usageStats.tier,
      },
      ai_generation: {
        used: usageStats.ai_generation.used,
        limit: usageStats.ai_generation.limit,
        remaining: usageStats.ai_generation.remaining,
        percentage: usageStats.ai_generation.limit === -1
          ? 0
          : Math.round((usageStats.ai_generation.used / usageStats.ai_generation.limit) * 100),
      },
      scans: {
        used: usageStats.scans.used,
        limit: usageStats.scans.limit,
        remaining: usageStats.scans.remaining,
        percentage: usageStats.scans.limit === -1
          ? 0
          : Math.round((usageStats.scans.used / usageStats.scans.limit) * 100),
      },
      cycle: {
        start: usageStats.cycle.start,
        end: usageStats.cycle.end,
        daysUntilReset: usageStats.cycle.days_until_reset,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in GET /api/tiers/usage:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
