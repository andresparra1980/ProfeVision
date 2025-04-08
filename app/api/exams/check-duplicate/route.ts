import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Crear cliente Supabase con Service Role Key para operaciones del lado del servidor
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

    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');

    if (!examId || !studentId) {
      return NextResponse.json(
        { error: 'Se requieren examId y studentId' },
        { status: 400 }
      );
    }

    // Verificar si el examen existe
    const { data: examData, error: examError } = await supabase
      .from('examenes')
      .select('id')
      .eq('id', examId)
      .single();

    if (examError || !examData) {
      return NextResponse.json(
        { error: 'Examen no encontrado' },
        { status: 404 }
      );
    }

    // Para verificar si hay resultados previos, debemos verificar:
    // 1. Verificar si hay versiones para este examen
    // 2. Si hay versiones, buscar resultados con esas versiones y el estudiante específico
    // 3. Si no hay versiones, verificar resultados con version_id NULL para este examen y estudiante

    // Primero, obtener las versiones del examen
    const { data: versionesData, error: versionesError } = await supabase
      .from('versiones_examen')
      .select('id')
      .eq('examen_id', examId);

    if (versionesError) {
      console.error('Error al buscar versiones:', versionesError);
      return NextResponse.json(
        { error: 'Error al verificar versiones de examen' },
        { status: 500 }
      );
    }

    // Variable para almacenar el resultado
    let resultadoData = null;
    let resultadoError = null;

    // Si hay versiones, buscar resultados con esas versiones
    if (versionesData && versionesData.length > 0) {
      const versionIds = versionesData.map((version: { id: string }) => version.id);
      
      // Buscar resultados para este estudiante con las versiones de este examen
      const resultado = await supabase
        .from('resultados_examen')
        .select(`
          id,
          version_id,
          fecha_calificacion,
          puntaje_obtenido,
          porcentaje,
          estado
        `)
        .eq('estudiante_id', studentId)
        .in('version_id', versionIds)
        .order('fecha_calificacion', { ascending: false })
        .limit(1);
      
      resultadoData = resultado.data;
      resultadoError = resultado.error;
    } else {
      // Si no hay versiones, verificar si hay resultados directos para este examen
      console.log('No hay versiones para este examen. Buscando resultados directos.');
      
      const resultado = await supabase
        .from('resultados_examen')
        .select(`
          id,
          version_id,
          fecha_calificacion,
          puntaje_obtenido,
          porcentaje,
          estado
        `)
        .eq('estudiante_id', studentId)
        .eq('examen_id', examId)
        .is('version_id', null)
        .order('fecha_calificacion', { ascending: false })
        .limit(1);
      
      resultadoData = resultado.data;
      resultadoError = resultado.error;
    }

    if (resultadoError) {
      console.error('Error al buscar resultado previo:', resultadoError);
      return NextResponse.json(
        { error: 'Error al verificar resultados previos' },
        { status: 500 }
      );
    }

    // Si no hay resultados, verificar si hay exámenes escaneados directamente para este examen y estudiante
    if (!resultadoData || resultadoData.length === 0) {
      // Verificar si existe un examen escaneado para este examen
      const { data: escaneadosDirectos, error: escaneadosError } = await supabase
        .from('examenes_escaneados')
        .select('*')
        .eq('examen_id', examId)
        .order('fecha_escaneo', { ascending: false })
        .limit(1);

      if (escaneadosError) {
        console.error('Error al buscar escaneos directos:', escaneadosError);
      } else if (escaneadosDirectos && escaneadosDirectos.length > 0) {
        // Si hay un escaneo directo, verificar si el resultado asociado es de este estudiante
        if (escaneadosDirectos[0].resultado_id) {
          const { data: resultadoDirecto, error: resultadoDirectoError } = await supabase
            .from('resultados_examen')
            .select('*')
            .eq('id', escaneadosDirectos[0].resultado_id)
            .eq('estudiante_id', studentId)
            .single();

          if (!resultadoDirectoError && resultadoDirecto) {
            // Si encontramos un resultado directo, devolver información
            return NextResponse.json({
              exists: true,
              resultadoId: resultadoDirecto.id,
              fecha_calificacion: resultadoDirecto.fecha_calificacion,
              puntaje: resultadoDirecto.puntaje_obtenido,
              porcentaje: resultadoDirecto.porcentaje,
              estado: resultadoDirecto.estado,
              scan: {
                id: escaneadosDirectos[0].id,
                fecha_escaneo: escaneadosDirectos[0].fecha_escaneo
              }
            });
          }
        }
      }
    }

    // Verificar si existe un scan previo para el resultado encontrado (si existe)
    let scanData = null;
    if (resultadoData && resultadoData.length > 0) {
      const { data: scanDataResult, error: scanError } = await supabase
        .from('examenes_escaneados')
        .select('id, fecha_escaneo, resultado_id')
        .eq('examen_id', examId)
        .eq('resultado_id', resultadoData[0].id)
        .order('fecha_escaneo', { ascending: false })
        .limit(1);

      if (scanError) {
        console.error('Error al buscar escaneo previo:', scanError);
      } else {
        scanData = scanDataResult;
      }
    }

    // Si hay un resultado previo, devolver información
    if (resultadoData && resultadoData.length > 0) {
      return NextResponse.json({
        exists: true,
        resultadoId: resultadoData[0].id,
        fecha_calificacion: resultadoData[0].fecha_calificacion,
        puntaje: resultadoData[0].puntaje_obtenido,
        porcentaje: resultadoData[0].porcentaje,
        estado: resultadoData[0].estado,
        scan: scanData && scanData.length > 0 ? {
          id: scanData[0].id,
          fecha_escaneo: scanData[0].fecha_escaneo
        } : null
      });
    }

    // Si no hay resultado previo
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error en check-duplicate:', error);
    return NextResponse.json(
      { error: 'Error al verificar duplicados' },
      { status: 500 }
    );
  }
} 