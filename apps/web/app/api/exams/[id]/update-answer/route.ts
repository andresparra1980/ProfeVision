import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApiTranslator } from '@/i18n/api';

const DEBUG = process.env.NODE_ENV === 'development';

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(request, 'exams.id.update-answer');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: t('errors.missingId') },
        { status: 400 }
      );
    }

    // Get request body
    const { respuestaId, resultadoId, preguntaId, opcionId } = await request.json();
    
    if (!resultadoId || !preguntaId || !opcionId) {
      return NextResponse.json(
        { error: t('errors.missingFields') },
        { status: 400 }
      );
    }

    // 1. Validate the exam result belongs to the current exam
    const { data: resultadoData, error: resultadoFetchError } = await supabase
      .from('resultados_examen')
      .select('id, examen_id')
      .eq('id', resultadoId)
      .eq('examen_id', examId)
      .single();

    if (resultadoFetchError || !resultadoData) {
      if (DEBUG) console.error('Error al obtener resultado:', resultadoFetchError);
      return NextResponse.json(
        { error: t('errors.updateResult') },
        { status: 500 }
      );
    }

    // 2. Validate question belongs to exam and is enabled
    const { data: preguntaData, error: preguntaError } = await supabase
      .from('preguntas')
      .select('id, examen_id, habilitada, puntaje')
      .eq('id', preguntaId)
      .eq('examen_id', examId)
      .single();

    if (preguntaError || !preguntaData) {
      if (DEBUG) console.error('Error al obtener pregunta:', preguntaError);
      return NextResponse.json(
        { error: t('errors.fetchAllAnswers') },
        { status: 500 }
      );
    }

    if (!preguntaData.habilitada) {
      return NextResponse.json(
        { error: t('errors.updateAnswer') },
        { status: 400 }
      );
    }

    // 3. Get the option details to check if it's correct
    const { data: opcionData, error: opcionError } = await supabase
      .from('opciones_respuesta')
      .select('id, pregunta_id, es_correcta')
      .eq('id', opcionId)
      .single();

    if (opcionError) {
      if (DEBUG) console.error('Error al obtener opción:', opcionError);
      return NextResponse.json(
        { error: t('errors.fetchOption') },
        { status: 500 }
      );
    }

    if (opcionData.pregunta_id !== preguntaId) {
      return NextResponse.json(
        { error: t('errors.updateAnswer') },
        { status: 400 }
      );
    }

    const puntajePregunta = Number(preguntaData.puntaje || 0);
    const puntajeRespuesta = opcionData.es_correcta ? puntajePregunta : 0;

    // 4. Create or update the student's answer
    const { data: respuestaData, error: respuestaError } = await supabase
      .from('respuestas_estudiante')
      .upsert({
        ...(respuestaId ? { id: respuestaId } : {}),
        resultado_id: resultadoId,
        pregunta_id: preguntaId,
        opcion_id: opcionId,
        es_correcta: opcionData.es_correcta,
        puntaje_obtenido: puntajeRespuesta,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'resultado_id,pregunta_id'
      })
      .select('id, resultado_id')
      .single();

    if (respuestaError) {
      if (DEBUG) console.error('Error al actualizar respuesta:', respuestaError);
      return NextResponse.json(
        { error: t('errors.updateAnswer') },
        { status: 500 }
      );
    }

    // 5. Get enabled questions for this exam to recalculate the score
    const { data: preguntasHabilitadas, error: preguntasHabilitadasError } = await supabase
      .from('preguntas')
      .select('id')
      .eq('examen_id', examId)
      .eq('habilitada', true);

    if (preguntasHabilitadasError) {
      if (DEBUG) console.error('Error al obtener preguntas habilitadas:', preguntasHabilitadasError);
      return NextResponse.json(
        { error: t('errors.fetchAllAnswers') },
        { status: 500 }
      );
    }

    const preguntaIdsHabilitadas = (preguntasHabilitadas || []).map((pregunta) => pregunta.id);
    const totalPreguntasHabilitadas = preguntaIdsHabilitadas.length;

    // 6. Get all answers for this result to recalculate the score
    let todasRespuestas: Array<{ pregunta_id: string; es_correcta: boolean }> = [];

    if (preguntaIdsHabilitadas.length > 0) {
      const { data: respuestasData, error: respuestasError } = await supabase
        .from('respuestas_estudiante')
        .select('pregunta_id, es_correcta')
        .eq('resultado_id', respuestaData.resultado_id)
        .in('pregunta_id', preguntaIdsHabilitadas);

      if (respuestasError) {
        if (DEBUG) console.error('Error al obtener todas las respuestas:', respuestasError);
        return NextResponse.json(
          { error: t('errors.fetchAllAnswers') },
          { status: 500 }
        );
      }

      todasRespuestas = respuestasData || [];
    }

    // Calculate new score
    const respuestasCorrectas = todasRespuestas.filter(r => r.es_correcta).length;
    const nuevoPuntaje = totalPreguntasHabilitadas > 0
      ? (respuestasCorrectas / totalPreguntasHabilitadas) * 5
      : 0;
    const nuevoPorcentaje = totalPreguntasHabilitadas > 0
      ? (respuestasCorrectas / totalPreguntasHabilitadas) * 100
      : 0;

    // 7. Update the exam result with new score
    const { error: resultadoError } = await supabase
      .from('resultados_examen')
      .update({
        puntaje_obtenido: nuevoPuntaje,
        porcentaje: nuevoPorcentaje,
        updated_at: new Date().toISOString()
      })
      .eq('id', respuestaData.resultado_id);

    if (resultadoError) {
      if (DEBUG) console.error('Error al actualizar resultado:', resultadoError);
      return NextResponse.json(
        { error: t('errors.updateResult') },
        { status: 500 }
      );
    }

    // Return updated data
    return NextResponse.json({
      success: true,
      respuestaId: respuestaData.id,
      es_correcta: opcionData.es_correcta,
      puntajeRespuesta,
      puntajeObtenido: nuevoPuntaje,
      porcentaje: nuevoPorcentaje
    });
    
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('Error al procesar la solicitud:', error);
    }
    return NextResponse.json(
      { error: (await getApiTranslator(request, 'exams.id.update-answer')).t('errors.internal') },
      { status: 500 }
    );
  }
} 
