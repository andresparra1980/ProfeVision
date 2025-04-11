import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';

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
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'ID de examen no proporcionado' },
        { status: 400 }
      );
    }

    // Get request body
    const { respuestaId, opcionId } = await request.json();
    
    if (!respuestaId || !opcionId) {
      return NextResponse.json(
        { error: 'Se requiere respuestaId y opcionId' },
        { status: 400 }
      );
    }

    // 1. Get the option details to check if it's correct
    const { data: opcionData, error: opcionError } = await supabase
      .from('opciones_respuesta')
      .select('es_correcta')
      .eq('id', opcionId)
      .single();

    if (opcionError) {
      if (DEBUG) console.error('Error al obtener opción:', opcionError);
      return NextResponse.json(
        { error: 'Error al verificar la opción' },
        { status: 500 }
      );
    }

    // 2. Update the student's answer
    const { data: respuestaData, error: respuestaError } = await supabase
      .from('respuestas_estudiante')
      .update({
        opcion_id: opcionId,
        es_correcta: opcionData.es_correcta
      })
      .eq('id', respuestaId)
      .select('resultado_id')
      .single();

    if (respuestaError) {
      if (DEBUG) console.error('Error al actualizar respuesta:', respuestaError);
      return NextResponse.json(
        { error: 'Error al actualizar la respuesta' },
        { status: 500 }
      );
    }

    // 3. Get all answers for this result to recalculate the score
    const { data: todasRespuestas, error: respuestasError } = await supabase
      .from('respuestas_estudiante')
      .select('es_correcta')
      .eq('resultado_id', respuestaData.resultado_id);

    if (respuestasError) {
      if (DEBUG) console.error('Error al obtener todas las respuestas:', respuestasError);
      return NextResponse.json(
        { error: 'Error al recalcular puntaje' },
        { status: 500 }
      );
    }

    // Calculate new score
    const respuestasCorrectas = todasRespuestas.filter(r => r.es_correcta).length;
    const totalPreguntas = todasRespuestas.length;
    const nuevoPuntaje = (respuestasCorrectas / totalPreguntas) * 5;
    const nuevoPorcentaje = (respuestasCorrectas / totalPreguntas) * 100;

    // 4. Update the exam result with new score
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
        { error: 'Error al actualizar puntaje final' },
        { status: 500 }
      );
    }

    // Return updated data
    return NextResponse.json({
      success: true,
      es_correcta: opcionData.es_correcta,
      puntajeObtenido: nuevoPuntaje,
      porcentaje: nuevoPorcentaje
    });
    
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('Error al procesar la solicitud:', error);
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 