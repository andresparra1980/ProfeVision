import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';
import { OnboardingStatus } from '@/lib/types/database';

/**
 * GET /api/onboarding/status
 * Get onboarding status for the authenticated teacher
 */
export async function GET(req: NextRequest) {
  try {
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

    const supabase = createClient();

    const { data: profesor, error } = await supabase
      .from('profesores')
      .select('first_login_completed, onboarding_status')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Error fetching onboarding status:', error);
      return NextResponse.json(
        { error: 'Error al obtener estado de onboarding' },
        { status: 500 }
      );
    }

    // Determine user type and onboarding state
    const onboardingStatus = profesor.onboarding_status as OnboardingStatus | null;
    // Legacy user: null OR partial blob without wizard data (defensive check for corrupted states)
    const isLegacyUser = onboardingStatus === null || 
      (!onboardingStatus?.wizard_completed && !onboardingStatus?.wizard_step && onboardingStatus?.wizard_step !== 0);
    
    // Should show wizard?
    // - Post-migration user with incomplete wizard: YES
    // - Legacy user who completed first login: NO
    // - Legacy user who never completed: evaluate (for now NO)
    let shouldShowWizard = false;
    if (!isLegacyUser && !onboardingStatus?.wizard_completed) {
      shouldShowWizard = true;
    }

    const response = {
      is_legacy_user: isLegacyUser,
      first_login_completed: profesor.first_login_completed,
      onboarding_status: onboardingStatus,
      should_show_wizard: shouldShowWizard,
      checklist_complete: onboardingStatus?.checklist_items 
        ? Object.values(onboardingStatus.checklist_items).every(Boolean)
        : false,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in GET /api/onboarding/status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding/status
 * Update onboarding status for the authenticated teacher
 */
export async function PATCH(req: NextRequest) {
  try {
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

    const body = await req.json();
    const statusUpdate: Partial<OnboardingStatus> = body;

    const supabase = createClient();

    // Use the SQL function to merge status
    const { data, error } = await supabase.rpc('update_onboarding_status', {
      p_user_id: user.id,
      p_status_json: statusUpdate,
    });

    if (error) {
      logger.error('Error updating onboarding status:', error);
      return NextResponse.json(
        { error: 'Error al actualizar estado de onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding_status: data,
    });
  } catch (error) {
    logger.error('Error in PATCH /api/onboarding/status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
