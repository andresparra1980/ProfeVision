import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente de Supabase para el servidor usando SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;

    // Obtener el token de autorización del header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: exam, error } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examId)
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(exam);
  } catch (error) {
    console.error('API /exams/[id]: Error:', error);
    return NextResponse.json({
      error: 'Error al procesar la solicitud',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;

    // Obtener el token de autorización del header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Verificar que el examen existe y está en borrador
    const { data: exam, error: examError } = await supabase
      .from('examenes')
      .select('estado')
      .eq('id', examId)
      .single();

    if (examError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 });
    }
    if (examError) throw examError;

    if (exam.estado !== 'borrador') {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar exámenes en estado borrador' 
      }, { status: 400 });
    }

    // 2. Obtener las preguntas del examen
    const { data: preguntas, error: preguntasError } = await supabase
      .from('preguntas')
      .select('id')
      .eq('examen_id', examId);

    if (preguntasError) throw preguntasError;

    // 3. Si hay preguntas, eliminar sus opciones de respuesta
    if (preguntas && preguntas.length > 0) {
      const preguntaIds = preguntas.map((p: { id: string }) => p.id);
      const { error: opcionesError } = await supabase
        .from('opciones_respuesta')
        .delete()
        .in('pregunta_id', preguntaIds);

      if (opcionesError) throw opcionesError;
    }

    // 4. Eliminar las preguntas
    const { error: deletePreguntasError } = await supabase
      .from('preguntas')
      .delete()
      .eq('examen_id', examId);

    if (deletePreguntasError) throw deletePreguntasError;

    // 5. Finalmente, eliminar el examen
    const { error: deleteExamError } = await supabase
      .from('examenes')
      .delete()
      .eq('id', examId);

    if (deleteExamError) throw deleteExamError;

    return NextResponse.json({ 
      message: 'Examen y elementos relacionados eliminados correctamente' 
    });

  } catch (error) {
    console.error('API /exams/[id] DELETE: Error:', error);
    return NextResponse.json({
      error: 'Error al eliminar el examen',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 