import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/utils/logger'; // Assuming you have a logger utility
import { getApiTranslator } from '@/i18n/api';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Define the expected structure of the route parameters
interface Params {
  id: string;
}

export const dynamic = 'force-dynamic'; // Ensures the route is not statically cached

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> } // Destructure params directly
) {
  const examId = (await params).id;
  const { t } = await getApiTranslator(request, 'exams.id.edit-name');

  if (!examId) {
    return NextResponse.json(
      { error: t('errors.missingId') },
      { status: 400 }
    );
  }

  let newTitle: string;
  try {
    const body = await request.json();
    newTitle = body.title;

    if (!newTitle || typeof newTitle !== 'string' || newTitle.trim() === '') {
      return NextResponse.json(
        { error: t('errors.missingTitle') },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Error parsing request body for exam title update:', error);
    return NextResponse.json(
      { error: t('errors.invalidBody') },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('examenes')
      .update({ titulo: newTitle.trim() })
      .eq('id', examId)
      .select(); // Optionally select to confirm the update and get the updated row

    if (error) {
      logger.error(`Error updating exam title in Supabase for examId ${examId}:`, error);
      return NextResponse.json(
        { error: t('errors.updateTitle'), details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      logger.warn(`No exam found with id ${examId} to update title.`);
      return NextResponse.json(
        { error: t('errors.notFound') },
        { status: 404 }
      );
    }

    logger.log(`Exam title updated successfully for examId ${examId}. New title: ${newTitle.trim()}`);
    return NextResponse.json({ 
      message: t('success.titleUpdated'),
      updatedExam: data[0] // Return the updated exam details
    }, { status: 200 });

  } catch (error: unknown) {
    logger.error(`Unexpected error during exam title update for examId ${examId}:`, error);
    return NextResponse.json(
      { error: t('errors.unexpected'), details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
