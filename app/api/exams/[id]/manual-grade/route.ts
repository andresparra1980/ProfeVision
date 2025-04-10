import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';

const DEBUG = process.env.NODE_ENV === 'development';

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    
    const { estudianteId, puntaje } = await request.json();
    
    if (!estudianteId || puntaje === undefined) {
      return NextResponse.json(
        { error: 'Se requiere estudianteId y puntaje' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un resultado para este estudiante en este examen
    const { data: existingResult } = await supabase
      .from('resultados_examen')
      .select('id')
      .eq('examen_id', examId)
      .eq('estudiante_id', estudianteId)
      .maybeSingle();

    let resultadoId;
    const porcentaje = (puntaje / 5) * 100; // Asumiendo que la escala es de 0 a 5
    const fechaCalificacion = new Date().toISOString();

    if (existingResult) {
      // Actualizar resultado existente
      const { error: updateError } = await supabase
        .from('resultados_examen')
        .update({
          puntaje_obtenido: puntaje,
          porcentaje,
          fecha_calificacion: fechaCalificacion,
          estado: "CALIFICADO",
          updated_at: fechaCalificacion
        })
        .eq('id', existingResult.id);

      if (updateError) {
        if (DEBUG) {
          console.error("Error al actualizar la calificación:", updateError);
        }
        return NextResponse.json(
          { error: 'Error al actualizar la calificación' },
          { status: 500 }
        );
      }

      resultadoId = existingResult.id;
    } else {
      // Crear nuevo resultado
      const { data: newResult, error: insertError } = await supabase
        .from('resultados_examen')
        .insert({
          examen_id: examId,
          estudiante_id: estudianteId,
          puntaje_obtenido: puntaje,
          porcentaje,
          fecha_calificacion: fechaCalificacion,
          estado: "CALIFICADO"
        })
        .select('id')
        .single();

      if (insertError) {
        if (DEBUG) {
          console.error("Error al insertar la calificación:", insertError);
        }
        return NextResponse.json(
          { error: 'Error al insertar la calificación' },
          { status: 500 }
        );
      }

      resultadoId = newResult.id;
    }

    // Sincronizar calificaciones automáticamente si hay vínculos
    try {
      const { data: vinculos } = await supabase
        .from('examenes_a_componentes_calificacion')
        .select('componente_id')
        .eq('examen_id', examId);
      
      if (vinculos && vinculos.length > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (token) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/exams/sync-grades`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ examId: examId })
          }).catch((error: Error) => {
            if (DEBUG) {
              console.error('Error al sincronizar calificaciones:', error);
            }
          });
        }
      }
    } catch (syncError: unknown) {
      if (DEBUG) {
        console.error('Error al intentar sincronizar calificaciones:', syncError);
      }
    }

    return NextResponse.json({
      success: true,
      resultadoId,
      puntaje,
      porcentaje
    });

  } catch (error: unknown) {
    if (DEBUG) {
      console.error('Error in manual-grade route:', error);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 