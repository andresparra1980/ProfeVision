import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestData {
  examId?: string;
}

serve(async (req) => {
  try {
    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos de la petición
    const requestData: RequestData = await req.json();
    const { examId } = requestData;

    if (!examId) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el ID del examen' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener vínculos del examen con componentes de calificación
    const { data: vinculos, error: vinculosError } = await supabase
      .from('examenes_a_componentes_calificacion')
      .select(`
        examen_id,
        componente_id,
        examen:examen_id (
          titulo,
          puntaje_total
        )
      `)
      .eq('examen_id', examId);
    
    if (vinculosError) {
      console.error('Error al obtener vínculos:', vinculosError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener vínculos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!vinculos || vinculos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay vínculos para sincronizar' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener resultados del examen
    const { data: resultadosExamen, error: resultadosError } = await supabase
      .from('resultados_examen')
      .select(`
        id,
        estudiante_id,
        puntaje_obtenido,
        porcentaje,
        examen_id
      `)
      .eq('examen_id', examId)
      .eq('estado', 'CALIFICADO');
    
    if (resultadosError) {
      console.error(`Error al obtener resultados del examen ${examId}:`, resultadosError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener resultados del examen' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!resultadosExamen || resultadosExamen.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay resultados para este examen' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Procesar cada componente vinculado
    const resultados = [];
    
    for (const vinculo of vinculos) {
      const componenteId = vinculo.componente_id;
      
      // Procesar cada resultado de estudiante
      for (const resultado of resultadosExamen) {
        const estudianteId = resultado.estudiante_id;
        // Convertir porcentaje (0-100) a escala 0-5
        const calificacion = parseFloat(resultado.porcentaje) / 20;
        
        // Verificar si ya existe una calificación para este estudiante y componente
        const { data: calificacionExistente, error: calificacionError } = await supabase
          .from('calificaciones')
          .select('id')
          .eq('estudiante_id', estudianteId)
          .eq('componente_id', componenteId)
          .maybeSingle();
        
        if (calificacionError) {
          console.error(`Error al verificar calificación existente:`, calificacionError);
          continue;
        }
        
        // Si existe, actualizar; si no, insertar
        if (calificacionExistente) {
          const { error: updateError } = await supabase
            .from('calificaciones')
            .update({ valor: calificacion })
            .eq('id', calificacionExistente.id);
          
          if (updateError) {
            console.error(`Error al actualizar calificación:`, updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('calificaciones')
            .insert({
              id: crypto.randomUUID(),
              estudiante_id: estudianteId,
              componente_id: componenteId,
              valor: calificacion
            });
          
          if (insertError) {
            console.error(`Error al insertar calificación:`, insertError);
          }
        }
      }
      
      resultados.push({ componente_id: componenteId, sincronizado: true });
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Sincronización completada', 
        resultados,
        examId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en sincronización de notas:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 