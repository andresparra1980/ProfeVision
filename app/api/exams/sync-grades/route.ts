import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import logger from '@/lib/utils/logger';

// Definir interfaces para tipado
interface ResultadoExamen {
  id: string;
  estudiante_id: string;
  puntaje_obtenido: number;
  porcentaje: number;
  examen_id: string;
}

const DEBUG = process.env.NODE_ENV === 'development';

// Crear un cliente de Supabase sin cookies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    // Obtener el token de autorización del header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    let isServiceToken = false;
    
    // Comprobar si es el token de servicio
    if (token === serviceKey) {
      isServiceToken = true;
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, isServiceToken ? serviceKey : supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verificar si el usuario está autenticado (si no es el token de servicio)
    if (!isServiceToken) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    // Si se proporciona un examen_id en la solicitud, sincronizar solo ese examen
    // Si no, sincronizar todos los exámenes
    const { examId } = await req.json();
    
    const sincronizacionQuery = supabase
      .from('examenes_a_componentes_calificacion')
      .select(`
        examen_id,
        componente_id,
        examen:examen_id (
          titulo,
          puntaje_total
        )
      `);
    
    if (examId) {
      sincronizacionQuery.eq('examen_id', examId);
    }
    
    const { data: vinculos, error: vinculosError } = await sincronizacionQuery;
    
    if (vinculosError) {
      if (DEBUG) {
        logger.error('Error al obtener vínculos:', vinculosError);
      }
      return NextResponse.json({ error: 'Error al obtener vínculos' }, { status: 500 });
    }
    
    if (!vinculos || vinculos.length === 0) {
      return NextResponse.json({ message: 'No hay vínculos para sincronizar' });
    }
    
    // For debugging
    if (DEBUG) {
      logger.log('Estructura de vínculos:', JSON.stringify(vinculos[0]));
    }
    
    // Agrupar vínculos por examen_id para reducir consultas
    const vinculosPorExamen: Record<string, Array<{ 
      componente_id: string, 
      examen: Record<string, unknown> 
    }>> = {};
    
    vinculos.forEach((vinculo: Record<string, unknown>) => {
      if (!vinculosPorExamen[vinculo.examen_id as string]) {
        vinculosPorExamen[vinculo.examen_id as string] = [];
      }
      vinculosPorExamen[vinculo.examen_id as string].push({
        componente_id: vinculo.componente_id as string,
        examen: vinculo.examen as Record<string, unknown>
      });
    });
    
    // Sincronizar cada examen con sus componentes
    const resultados = [];
    
    for (const examenId of Object.keys(vinculosPorExamen)) {
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
        .eq('examen_id', examenId)
        .eq('estado', 'CALIFICADO'); // Usar 'CALIFICADO' en mayúsculas
      
      if (resultadosError) {
        if (DEBUG) {
          logger.error(`Error al obtener resultados del examen ${examenId}:`, resultadosError);
        }
        continue;
      }
      
      if (!resultadosExamen || resultadosExamen.length === 0) {
        resultados.push({ examen_id: examenId, message: 'No hay resultados para este examen' });
        continue;
      }
      
      // Actualizar calificaciones para cada componente vinculado
      for (const vinculo of vinculosPorExamen[examenId]) {
        const componenteId = vinculo.componente_id;
        
        // Procesar cada resultado de estudiante
        for (const resultado of resultadosExamen as ResultadoExamen[]) {
          const estudianteId = resultado.estudiante_id;
          // Usamos el porcentaje como calificación (de 0 a 5)
          // Si la escala es diferente, ajustar esta conversión
          const calificacion = parseFloat(resultado.porcentaje as unknown as string) / 20; // Convertir porcentaje (0-100) a escala 0-5
          
          // Verificar si ya existe una calificación para este estudiante y componente
          const { data: calificacionExistente, error: calificacionError } = await supabase
            .from('calificaciones')
            .select('id')
            .eq('estudiante_id', estudianteId)
            .eq('componente_id', componenteId)
            .maybeSingle();
          
          if (calificacionError) {
            if (DEBUG) {
              logger.error(`Error al verificar calificación existente:`, calificacionError);
            }
            continue;
          }
          
          // Si existe, actualizar; si no, insertar
          if (calificacionExistente) {
            const { error: updateError } = await supabase
              .from('calificaciones')
              .update({ valor: calificacion })
              .eq('id', calificacionExistente.id);
            
            if (updateError) {
              if (DEBUG) {
                logger.error(`Error al actualizar calificación:`, updateError);
              }
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
              if (DEBUG) {
                logger.error(`Error al insertar calificación:`, insertError);
              }
            }
          }
        }
      }
      
      resultados.push({ examen_id: examenId, sincronizado: true });
    }
    
    return NextResponse.json({ 
      message: 'Sincronización completada', 
      resultados 
    });
    
  } catch (error: unknown) {
    if (DEBUG) {
      logger.error('Error en sincronización de notas:', error);
    }
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 