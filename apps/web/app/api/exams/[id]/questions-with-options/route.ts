import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApiTranslator } from '@/i18n/api';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { t } = await getApiTranslator(req, 'exams.id.questions');
    const { id: examId } = await params;

    if (!examId) {
      return NextResponse.json(
        { error: t('errors.missingId') },
        { status: 400 }
      );
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
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Fetch questions
    const { data: questions, error: qErr } = await supabase
      .from('preguntas')
      .select('id, texto, tipo_id, puntaje, dificultad, retroalimentacion, orden, habilitada')
      .eq('examen_id', examId)
      .order('orden');

    if (qErr) {
      return NextResponse.json(
        { error: t('errors.fetchQuestions') },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json([]);
    }

    const preguntaIds = questions.map((q) => q.id);

    // Fetch options for all questions
    const { data: options, error: oErr } = await supabase
      .from('opciones_respuesta')
      .select('pregunta_id, texto, es_correcta, orden')
      .in('pregunta_id', preguntaIds)
      .order('orden');

    if (oErr) {
      return NextResponse.json(
        { error: t('errors.fetchQuestions') },
        { status: 500 }
      );
    }

    type OptionRow = { pregunta_id: string | number; texto: string; es_correcta: boolean; orden: number };
    const optionsByQuestion: Record<string, Array<{ texto: string; es_correcta: boolean; orden: number }>> = {};
    for (const opt of (options as OptionRow[] | null) || []) {
      const key = String(opt.pregunta_id);
      if (!optionsByQuestion[key]) optionsByQuestion[key] = [];
      optionsByQuestion[key].push({
        texto: opt.texto,
        es_correcta: Boolean(opt.es_correcta),
        orden: Number(opt.orden) || 0,
      });
    }

    const result = questions.map((q) => ({
      id: q.id,
      texto: q.texto,
      tipo_id: q.tipo_id,
      puntaje: q.puntaje,
      dificultad: q.dificultad,
      retroalimentacion: q.retroalimentacion,
      orden: q.orden,
      habilitada: q.habilitada,
      opciones: (optionsByQuestion[String(q.id)] || []).sort((a, b) => a.orden - b.orden),
    }));

    return NextResponse.json(result);
  } catch (_error) {
    const { t } = await getApiTranslator(req, 'exams.id.questions');
    return NextResponse.json(
      { error: t('errors.internal') },
      { status: 500 }
    );
  }
}
