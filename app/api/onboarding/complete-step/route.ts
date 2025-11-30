import { NextRequest, NextResponse } from 'next/server';
import { verifyTeacherAuth } from '@/lib/auth/verify-teacher';
import { createClient } from '@/lib/supabase/server';
import logger from '@/lib/utils/logger';

type ChecklistItem = 'exam_created' | 'exam_published' | 'pdf_exported' | 'first_scan';

interface CompleteStepBody {
  step: 'wizard' | 'checklist_item';
  wizard_step?: number;
  checklist_item?: ChecklistItem;
  skip?: boolean;
  skip_reason?: string;
}

/**
 * POST /api/onboarding/complete-step
 * Mark a specific onboarding step as completed
 */
export async function POST(req: NextRequest) {
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

    const body: CompleteStepBody = await req.json();
    const { step, wizard_step, checklist_item, skip, skip_reason } = body;

    const supabase = createClient();

    let statusUpdate: Record<string, unknown> = {};

    if (step === 'wizard') {
      if (skip) {
        // User skipped the wizard
        statusUpdate = {
          skipped: true,
          skip_reason: skip_reason || 'user_choice',
          wizard_completed: true,
          wizard_completed_at: new Date().toISOString(),
        };
      } else if (wizard_step !== undefined) {
        // Update current wizard step
        statusUpdate = {
          wizard_step,
        };
        
        // If this is step 0 and no started_at, set it
        if (wizard_step === 0) {
          statusUpdate.wizard_started_at = new Date().toISOString();
        }
        
        // Final step (6 steps: 0-5, so step 5 is the last)
        // Note: We only mark completed when wizard_step > 5 (after user closes from completion screen)
        // This allows the completion step (5) to be shown before closing
        if (wizard_step > 5) {
          statusUpdate.wizard_completed = true;
          statusUpdate.wizard_completed_at = new Date().toISOString();
        }
      }
    } else if (step === 'checklist_item' && checklist_item) {
      // Update specific checklist item
      statusUpdate = {
        checklist_items: {
          [checklist_item]: true,
        },
      };
    }

    // Use the SQL function to merge status
    const { data, error } = await supabase.rpc('update_onboarding_status', {
      p_user_id: user.id,
      p_status_json: statusUpdate,
    });

    if (error) {
      logger.error('Error completing onboarding step:', error);
      return NextResponse.json(
        { error: 'Error al completar paso de onboarding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding_status: data,
    });
  } catch (error) {
    logger.error('Error in POST /api/onboarding/complete-step:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
