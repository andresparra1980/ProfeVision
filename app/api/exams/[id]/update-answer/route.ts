import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Pregunta {
  puntaje: number;
  habilitada: boolean;
}

interface RespuestaEstudiante {
  es_correcta: boolean;
  pregunta: Pregunta;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { respuestaId, opcionId } = await request.json();
    
    if (!respuestaId || !opcionId) {
      return NextResponse.json(
        { error: 'Se requiere respuestaId y opcionId' },
        { status: 400 }
      );
    }

    // 1. Obtener la información de la opción seleccionada
    const { data: opcionData, error: opcionError } = await supabase
      .from('opciones_respuesta')
      .select('*')
      .eq('id', opcionId)
      .single();

    if (opcionError) {
      return NextResponse.json(
        { error: 'Error al obtener la opción de respuesta' },
        { status: 500 }
      );
    }

    // 2. Actualizar la respuesta del estudiante
    const { data: respuestaData, error: respuestaError } = await supabase
      .from('respuestas_estudiante')
      .update({
        opcion_id: opcionId,
        es_correcta: opcionData.es_correcta,
        updated_at: new Date().toISOString()
      })
      .eq('id', respuestaId)
      .select('resultado_id')
      .single();

    if (respuestaError) {
      return NextResponse.json(
        { error: 'Error al actualizar la respuesta' },
        { status: 500 }
      );
    }

    // 3. Obtener todas las respuestas del resultado para recalcular
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas_estudiante')
      .select(`
        es_correcta,
        pregunta:preguntas!inner(
          puntaje,
          habilitada
        )
      `)
      .eq('resultado_id', respuestaData.resultado_id)
      .throwOnError();

    if (respuestasError || !respuestas) {
      return NextResponse.json(
        { error: 'Error al obtener las respuestas' },
        { status: 500 }
      );
    }

    // 4. Calcular nuevo puntaje y porcentaje
    let preguntasHabilitadas = 0;
    let respuestasCorrectas = 0;

    respuestas.forEach((respuesta: any) => {
      if (respuesta.pregunta?.habilitada) {
        preguntasHabilitadas++;
        if (respuesta.es_correcta) {
          respuestasCorrectas++;
        }
      }
    });

    const porcentaje = (respuestasCorrectas / preguntasHabilitadas) * 100;
    // Calcular puntaje en escala de 0 a 5
    const puntajeObtenido = (porcentaje / 100) * 5;

    // 5. Actualizar el resultado del examen
    const { error: updateError } = await supabase
      .from('resultados_examen')
      .update({
        puntaje_obtenido: puntajeObtenido,
        porcentaje,
        updated_at: new Date().toISOString()
      })
      .eq('id', respuestaData.resultado_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar el resultado' },
        { status: 500 }
      );
    }

    // 6. Sincronizar calificaciones automáticamente
    try {
      // Verificar si este examen está vinculado a algún componente de calificación
      const { data: vinculos } = await supabase
        .from('examenes_a_componentes_calificacion')
        .select('componente_id')
        .eq('examen_id', respuestaData.examen_id);
      
      // Si hay vínculos, llamar a la API de sincronización
      if (vinculos && vinculos.length > 0) {
        // Obtener token de sesión para la petición
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (token) {
          // Llamar a la API existente en lugar de la Edge Function
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/exams/sync-grades`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ examId: respuestaData.examen_id })
          }).catch(error => {
            console.error('Error al sincronizar calificaciones:', error);
          });
        }
      }
    } catch (syncError) {
      console.error('Error al intentar sincronizar calificaciones:', syncError);
      // No devolvemos error al cliente ya que la actualización principal fue exitosa
    }

    return NextResponse.json({
      success: true,
      puntajeObtenido,
      porcentaje,
      respuestasCorrectas,
      preguntasHabilitadas,
      es_correcta: opcionData.es_correcta
    });

  } catch (error: any) {
    console.error('Error in update-answer route:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 