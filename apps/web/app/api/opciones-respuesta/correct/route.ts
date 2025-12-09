import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApiTranslator } from '@/i18n/api';

export async function POST(req: NextRequest) {
  try {
    const { questionIds } = await req.json();
    
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: (await getApiTranslator(req, 'opciones-respuesta.correct')).t('errors.missingArray') },
        { status: 400 }
      );
    }
    
    // Inicializar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: (await getApiTranslator(req, 'opciones-respuesta.correct')).t('errors.serverConfig') },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Obtener opciones de respuesta para las preguntas especificadas
    const { data: optionsData, error } = await supabase
      .from('opciones_respuesta')
      .select(`
        *,
        pregunta:preguntas!inner(
          id,
          habilitada
        )
      `)
      .in('pregunta_id', questionIds);
    
    if (error) {
      console.error('Error al obtener opciones de respuesta:', error);
      return NextResponse.json(
        { error: (await getApiTranslator(req, 'opciones-respuesta.correct')).t('errors.fetch') },
        { status: 500 }
      );
    }
    
    return NextResponse.json(optionsData || []);
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: (await getApiTranslator(req, 'opciones-respuesta.correct')).t('errors.internal') },
      { status: 500 }
    );
  }
} 