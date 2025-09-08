import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';

const DEBUG = process.env.NODE_ENV === 'development';

// Crear cliente de Supabase para el servidor usando SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(request, 'exams.id');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const { data: exam, error } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', examId)
      .single();

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: t('errors.notFound') }, { status: 404 });
    }
    if (error) throw error;

    return NextResponse.json(exam);
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /exams/[id]: Error:', error);
    }
    const { t } = await getApiTranslator(request, 'exams.id');
    return NextResponse.json({
      error: t('errors.internal'),
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(request, 'exams.id');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    // 1. Verificar que el examen existe y está en borrador
    const { data: exam, error: examError } = await supabase
      .from('examenes')
      .select('estado')
      .eq('id', examId)
      .single();

    if (examError?.code === 'PGRST116') {
      return NextResponse.json({ error: t('errors.notFound') }, { status: 404 });
    }
    if (examError) throw examError;

    if (exam.estado !== 'borrador') {
      return NextResponse.json({ 
        error: t('errors.onlyDraftDelete') 
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
    
    // 5. Eliminar las relaciones con grupos
    const { error: deleteGruposError } = await supabase
      .from('examen_grupo')
      .delete()
      .eq('examen_id', examId);
      
    if (deleteGruposError) throw deleteGruposError;

    // 6. Finalmente, eliminar el examen
    const { error: deleteExamError } = await supabase
      .from('examenes')
      .delete()
      .eq('id', examId);

    if (deleteExamError) throw deleteExamError;

    return NextResponse.json({ 
      message: t('success.deleted') 
    });

  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /exams/[id] DELETE: Error:', error);
    }
    const { t } = await getApiTranslator(request, 'exams.id');
    return NextResponse.json({
      error: t('errors.internal'),
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { t } = await getApiTranslator(req, 'exams.id');
    const { id: examId } = await params;
    const { estado } = await req.json();

    // Obtener el token de autorización del header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    // 1. Verificar que el examen existe
    const { error: examError } = await supabase
      .from('examenes')
      .select('id')
      .eq('id', examId)
      .single();

    if (examError?.code === 'PGRST116') {
      return NextResponse.json({ error: t('errors.notFound') }, { status: 404 });
    }
    if (examError) throw examError;

    // 2. Actualizar el estado del examen
    const { error: updateError } = await supabase
      .from('examenes')
      .update({ estado })
      .eq('id', examId);

    if (updateError) throw updateError;

    // 3. Si el estado cambia, actualizar también el estado de las asignaciones de grupos
    let examen_grupo_estado = estado;
    if (estado === 'publicado') {
      examen_grupo_estado = 'programado';
    }

    const { error: updateGruposError } = await supabase
      .from('examen_grupo')
      .update({ estado: examen_grupo_estado })
      .eq('examen_id', examId);

    if (updateGruposError) throw updateGruposError;

    return NextResponse.json({ 
      message: t('success.stateUpdated'),
      estado: estado
    });

  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /exams/[id] PATCH: Error:', error);
    }
    const { t } = await getApiTranslator(req, 'exams.id');
    return NextResponse.json({
      error: t('errors.updateState'),
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(request, 'exams.id');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;

    // Obtener el token de autorización del header (mismo comportamiento que otros handlers)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: t('errors.unauthorized') }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: t('errors.serverConfig') },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const {
      titulo,
      descripcion,
      preguntas,
      duracion_minutos,
      puntaje_total,
    } = body as {
      titulo?: string;
      descripcion?: string;
      preguntas?: Array<{
        texto: string;
        tipo?: string;
        opciones?: Array<{ texto: string; esCorrecta?: boolean }>;
      }>;
      duracion_minutos?: number;
      puntaje_total?: number;
    };

    // 1) Verificar que el examen existe
    const { data: examRow, error: examErr } = await supabase
      .from('examenes')
      .select('id, titulo, duracion_minutos, puntaje_total')
      .eq('id', examId)
      .single();

    if (examErr?.code === 'PGRST116') {
      return NextResponse.json({ error: t('errors.notFound') }, { status: 404 });
    }
    if (examErr) throw examErr;

    // 2) Actualizar metadatos del examen si vienen en el body
    if (
      typeof titulo !== 'undefined' ||
      typeof descripcion !== 'undefined' ||
      typeof duracion_minutos !== 'undefined' ||
      typeof puntaje_total !== 'undefined'
    ) {
      const { error: updExamErr } = await supabase
        .from('examenes')
        .update({
          ...(typeof titulo !== 'undefined' ? { titulo } : {}),
          ...(typeof descripcion !== 'undefined' ? { descripcion } : {}),
          ...(typeof duracion_minutos !== 'undefined' ? { duracion_minutos } : {}),
          ...(typeof puntaje_total !== 'undefined' ? { puntaje_total } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId);
      if (updExamErr) {
        if (DEBUG) console.error('Error al actualizar metadatos del examen:', updExamErr);
        return NextResponse.json({ error: t('errors.updateExam') }, { status: 500 });
      }
    }

    // 3) Si no se proporcionan preguntas, terminamos aquí (solo metadatos)
    if (!preguntas || !Array.isArray(preguntas)) {
      return NextResponse.json({ success: true, message: t('success.updated') });
    }

    // 4) Obtener preguntas existentes para limpiar opciones y preguntas
    const { data: existingQuestions, error: qErr } = await supabase
      .from('preguntas')
      .select('id')
      .eq('examen_id', examId);
    if (qErr) {
      if (DEBUG) console.error('Error al obtener preguntas existentes:', qErr);
      return NextResponse.json({ error: t('errors.updateExam') }, { status: 500 });
    }

    const existingIds = (existingQuestions || []).map((q: any) => q.id);

    if (existingIds.length > 0) {
      const { error: delOptsErr } = await supabase
        .from('opciones_respuesta')
        .delete()
        .in('pregunta_id', existingIds);
      if (delOptsErr) {
        if (DEBUG) console.error('Error al eliminar opciones existentes:', delOptsErr);
        return NextResponse.json({ error: t('errors.updateExam') }, { status: 500 });
      }

      const { error: delQErr } = await supabase
        .from('preguntas')
        .delete()
        .eq('examen_id', examId);
      if (delQErr) {
        if (DEBUG) console.error('Error al eliminar preguntas existentes:', delQErr);
        return NextResponse.json({ error: t('errors.updateExam') }, { status: 500 });
      }
    }

    // 5) Insertar nuevas preguntas y opciones
    const totalPoints = typeof puntaje_total === 'number' ? puntaje_total : (examRow?.puntaje_total ?? 5);
    const validPreguntas = preguntas.filter((p) => (p.texto || '').trim() !== '');
    const pointsPerQuestion = validPreguntas.length > 0
      ? parseFloat(((totalPoints as number) / validPreguntas.length).toFixed(2))
      : 0;

    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      const texto = (pregunta.texto || '').trim();
      if (!texto) continue;

      const { data: preguntaData, error: insQErr } = await supabase
        .from('preguntas')
        .insert({
          examen_id: examId,
          texto,
          tipo_id: pregunta.tipo || 'opcion_multiple',
          puntaje: pointsPerQuestion,
          orden: i + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (insQErr) {
        if (DEBUG) console.error('Error al insertar pregunta:', insQErr);
        continue;
      }

      if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
        let ordenActual = 1;
        for (const opcion of pregunta.opciones) {
          const optText = (opcion.texto || '').trim();
          if (!optText) continue;
          const { error: insOptErr } = await supabase
            .from('opciones_respuesta')
            .insert({
              pregunta_id: (preguntaData as any).id,
              texto: optText,
              es_correcta: Boolean(opcion.esCorrecta),
              orden: ordenActual++,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          if (insOptErr) {
            if (DEBUG) console.error('Error al insertar opción:', insOptErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: t('success.updated') });
  } catch (error) {
    if (DEBUG) {
      console.error('Error en PUT /api/exams/[id]:', error);
    }
    const { t } = await getApiTranslator(request, 'exams.id');
    return NextResponse.json(
      { error: t('errors.internal') },
      { status: 500 }
    );
  }
}
 