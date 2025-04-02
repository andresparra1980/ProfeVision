import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('API /exams/fix-details: Iniciando solicitud');
  
  const searchParams = req.nextUrl.searchParams;
  const examId = searchParams.get('id') || '48eb2046-9030-43f3-bb29-94081023ff83';
  
  console.log(`Buscando examen con ID: ${examId}`);
  
  try {
    // Conexión a Supabase con la URL y clave que conocemos que funcionan
    const supabaseUrl = 'https://yotzyxxwdzayehazvomi.supabase.co';
    
    // Intentamos con ambas claves
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Ejecutando consulta para obtener examen');
    const { data: exams, error: examError } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examId);
    
    if (examError) {
      console.error('Error al consultar examen:', examError);
      return NextResponse.json({ 
        error: examError.message,
        status: 'error'
      }, { status: 500 });
    }
    
    if (!exams || exams.length === 0) {
      console.log(`No se encontró el examen con ID: ${examId}`);
      return NextResponse.json({ 
        error: `No se encontró el examen con ID: ${examId}`,
        status: 'not_found'
      }, { status: 404 });
    }
    
    const examData = exams[0];
    console.log(`Examen encontrado: ${examData.titulo}`);
    
    // Si el examen tiene materia_id, obtener detalles de la materia
    if (examData.materia_id) {
      console.log(`Buscando materia con ID: ${examData.materia_id}`);
      
      const { data: materias, error: materiaError } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('id', examData.materia_id);
      
      if (!materiaError && materias && materias.length > 0) {
        console.log(`Materia encontrada: ${materias[0].nombre}`);
        examData.materia = materias[0];
      } else {
        console.log('No se encontró la materia relacionada');
        examData.materia = { 
          id: examData.materia_id, 
          nombre: materiaError ? 'Error al cargar materia' : 'Materia no encontrada' 
        };
      }
    }
    
    return NextResponse.json({
      examData,
      status: 'success',
      message: 'Examen encontrado correctamente'
    });
    
  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error desconocido',
      status: 'error'
    }, { status: 500 });
  }
} 