import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Manejar correctamente los parámetros en Next.js 14
    params = await Promise.resolve(params);
    const examId = params.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'ID de examen no proporcionado' },
        { status: 400 }
      );
    }
    
    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
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
    
    // Consultar el examen
    const { data: exams, error: examError } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examId);
    
    if (examError) {
      return NextResponse.json(
        { error: `Error en la consulta: ${examError.message}` },
        { status: 500 }
      );
    }
    
    if (!exams || exams.length === 0) {
      return NextResponse.json(
        { error: `Examen no encontrado con ID: ${examId}` },
        { status: 404 }
      );
    }
    
    // Obtener datos del examen
    const examData = exams[0];
    
    // Obtener datos de la materia si existe
    if (examData.materia_id) {
      const { data: materias, error: materiaError } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('id', examData.materia_id);
      
      if (!materiaError && materias && materias.length > 0) {
        examData.materia = materias[0];
      } else {
        examData.materia = { 
          id: examData.materia_id, 
          nombre: materiaError ? 'Error al cargar materia' : 'Materia no encontrada' 
        };
      }
    }
    
    return NextResponse.json(examData);
    
  } catch (error) {
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 