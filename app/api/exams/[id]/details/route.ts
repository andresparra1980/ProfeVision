import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'ID de examen no proporcionado' },
        { status: 400 }
      );
    }
    
    console.log(`API: Obteniendo detalles del examen ${examId}`);
    
    // Configurar cliente de Supabase con rol de servicio
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno Supabase faltantes');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Registramos las variables para debugging
    console.log(`API URL: ${supabaseUrl.substring(0, 15)}...`);
    console.log(`API Service Key presente: ${supabaseServiceKey ? 'Sí' : 'No'}`);
    
    // Obtener examen sin usar .single() para evitar errores
    const { data: examArray, error: examError } = await supabaseAdmin
      .from('examenes')
      .select('*')
      .eq('id', examId);
    
    if (examError) {
      console.error('Error al obtener examen:', examError);
      return NextResponse.json(
        { error: `Error al obtener examen: ${examError.message}` },
        { status: 500 }
      );
    }
    
    // Verificar si tenemos resultados
    if (!examArray || examArray.length === 0) {
      console.error(`No se encontró examen con ID: ${examId}`);
      return NextResponse.json(
        { error: `Examen no encontrado con ID: ${examId}` },
        { status: 404 }
      );
    }
    
    // Tomar el primer resultado (debería ser único por ID)
    const examData = examArray[0];
    console.log('Examen encontrado:', examData?.id, examData?.titulo);
    
    // Si el examen tiene materia_id, obtener detalles de la materia
    if (examData.materia_id) {
      console.log(`Buscando materia con ID: ${examData.materia_id}`);
      
      // Obtener materia sin usar .single()
      const { data: materiaArray, error: materiaError } = await supabaseAdmin
        .from('materias')
        .select('id, nombre')
        .eq('id', examData.materia_id);
      
      if (materiaError) {
        console.error('Error al obtener materia:', materiaError);
      } else if (materiaArray && materiaArray.length > 0) {
        const materiaData = materiaArray[0];
        console.log('Materia encontrada:', materiaData?.id, materiaData?.nombre);
        examData.materia = materiaData;
      } else {
        console.log('No se encontró la materia relacionada');
      }
    }
    
    return NextResponse.json(examData);
  } catch (error) {
    console.error('Error en API de detalles de examen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 