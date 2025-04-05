import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Manejar correctamente los parámetros en Next.js 14
    params = await Promise.resolve(params);
    const studentId = params.id;
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'ID de estudiante no proporcionado' },
        { status: 400 }
      );
    }
    
    // Inicializar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Consultar el estudiante con las columnas correctas según la estructura real de la tabla
    const { data: student, error } = await supabase
      .from('estudiantes')
      .select('*')  // Seleccionar todas las columnas para evitar errores de columnas inexistentes
      .eq('id', studentId)
      .single();
    
    if (error) {
      console.error('Error al obtener detalles del estudiante:', error);
      return NextResponse.json(
        { error: 'Error al obtener detalles del estudiante' },
        { status: 500 }
      );
    }
    
    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }
    
    // Crear un objeto con la información del estudiante
    // Adaptando a los nombres de columna que realmente existen
    const studentInfo = {
      id: student.id,
      nombres: student.nombres,
      apellidos: student.apellidos,
      identificacion: student.identificacion,
      email: student.email || null
    };
    
    return NextResponse.json(studentInfo);
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 