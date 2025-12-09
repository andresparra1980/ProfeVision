import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';

export const dynamic = 'force-dynamic';

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(request, 'exams.details');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: t('errors.missingId') },
        { status: 400 }
      );
    }
    
    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: t('errors.serverConfig') },
        { status: 500 }
      );
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Primero, obtener solo el examen para determinar su materia_id
    const { data: exam, error: examError } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (examError) {
      logger.error('Error al obtener examen:', examError);
      return NextResponse.json(
        { error: t('errors.fetchExam') },
        { status: 500 }
      );
    }
    
    if (!exam) {
      return NextResponse.json(
        { error: t('errors.notFound') },
        { status: 404 }
      );
    }
    
    // Buscar la materia asociada, si existe una relación
    let subjectData = null;
    if (exam.materia_id) {
      const { data: subject, error: subjectError } = await supabase
        .from('materias')
        .select('*')
        .eq('id', exam.materia_id)
        .single();
      
      if (!subjectError && subject) {
        subjectData = subject;
      } else if (subjectError) {
        logger.error('Error al obtener materia:', subjectError);
      }
    }
    
    // Preparar respuesta con los datos encontrados
    const response = {
      ...exam,
      materia: subjectData
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: (await getApiTranslator(request, 'exams.details')).t('errors.internal') },
      { status: 500 }
    );
  }
} 