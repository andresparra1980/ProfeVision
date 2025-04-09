import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { estudianteId, puntaje } = await request.json();
    
    if (!estudianteId || puntaje === undefined) {
      return NextResponse.json(
        { error: 'Se requiere estudianteId y puntaje' },
        { status: 400 }
      );
    }

    // Obtener el ID del examen (usar await según recomendación de Next.js)
    const examenId = await params.id;

    // Verificar si ya existe un resultado para este estudiante en este examen
    const { data: existingResult } = await supabase
      .from('resultados_examen')
      .select('id')
      .eq('examen_id', examenId)
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
        console.error("Error al actualizar la calificación:", updateError);
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
          examen_id: examenId,
          estudiante_id: estudianteId,
          puntaje_obtenido: puntaje,
          porcentaje,
          fecha_calificacion: fechaCalificacion,
          estado: "CALIFICADO"
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Error al insertar la calificación:", insertError);
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
        .eq('examen_id', examenId);
      
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
            body: JSON.stringify({ examId: examenId })
          }).catch(error => {
            console.error('Error al sincronizar calificaciones:', error);
          });
        }
      }
    } catch (syncError) {
      console.error('Error al intentar sincronizar calificaciones:', syncError);
    }

    return NextResponse.json({
      success: true,
      resultadoId,
      puntaje,
      porcentaje
    });

  } catch (error: any) {
    console.error('Error in manual-grade route:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 