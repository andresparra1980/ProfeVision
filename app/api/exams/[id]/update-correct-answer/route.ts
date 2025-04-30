import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import _logger from "@/lib/utils/logger";

const DEBUG = process.env.NODE_ENV === "development";

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;

    if (!examId) {
      return NextResponse.json(
        { error: "ID de examen no proporcionado" },
        { status: 400 }
      );
    }

    // Get request body
    const { questionId, optionId } = await request.json();

    if (!questionId || !optionId) {
      return NextResponse.json(
        { error: "Se requiere questionId y optionId" },
        { status: 400 }
      );
    }

    // 1. First verify if the question belongs to this exam
    const { data: _questionData, error: questionError } = await supabase
      .from("preguntas")
      .select("id")
      .eq("id", questionId)
      .eq("examen_id", examId)
      .single();

    if (questionError) {
      if (DEBUG) console.error("Error al verificar pregunta:", questionError);
      return NextResponse.json(
        {
          error:
            "Error al verificar la pregunta o la pregunta no pertenece a este examen",
        },
        { status: 400 }
      );
    }

    // 2. Get all options for this question
    const { data: options, error: optionsError } = await supabase
      .from("opciones_respuesta")
      .select("id")
      .eq("pregunta_id", questionId);

    if (optionsError) {
      if (DEBUG) console.error("Error al obtener opciones:", optionsError);
      return NextResponse.json(
        { error: "Error al obtener opciones de la pregunta" },
        { status: 500 }
      );
    }

    // 3. Verify the option belongs to this question
    const optionBelongsToQuestion = options.some(
      (option) => option.id === optionId
    );
    if (!optionBelongsToQuestion) {
      return NextResponse.json(
        { error: "La opción seleccionada no pertenece a esta pregunta" },
        { status: 400 }
      );
    }

    // 4. Update all options to set es_correcta = false
    const { error: updateAllError } = await supabase
      .from("opciones_respuesta")
      .update({ es_correcta: false })
      .eq("pregunta_id", questionId);

    if (updateAllError) {
      if (DEBUG) console.error("Error al actualizar opciones:", updateAllError);
      return NextResponse.json(
        { error: "Error al actualizar opciones de respuesta" },
        { status: 500 }
      );
    }

    // 5. Set the selected option as correct
    const { error: updateCorrectError } = await supabase
      .from("opciones_respuesta")
      .update({ es_correcta: true })
      .eq("id", optionId);

    if (updateCorrectError) {
      if (DEBUG)
        console.error(
          "Error al actualizar opción correcta:",
          updateCorrectError
        );
      return NextResponse.json(
        { error: "Error al actualizar opción correcta" },
        { status: 500 }
      );
    }

    // 6. Recalculate scores for all results of this exam
    const { data: resultados, error: resultadosError } = await supabase
      .from("resultados_examen")
      .select("id")
      .eq("examen_id", examId);

    if (resultadosError) {
      if (DEBUG) console.error("Error al obtener resultados:", resultadosError);
      return NextResponse.json(
        { error: "Error al obtener resultados para recalcular" },
        { status: 500 }
      );
    }

    // Process each result
    for (const resultado of resultados) {
      // Get all answers for this result
      const { data: respuestas, error: respuestasError } = await supabase
        .from("respuestas_estudiante")
        .select(
          `
          id,
          pregunta_id,
          opcion_id,
          opciones_respuesta!inner(es_correcta),
          pregunta:preguntas!inner(
            habilitada
          )
        `
        )
        .eq("resultado_id", resultado.id);

      if (respuestasError) {
        if (DEBUG)
          console.error("Error al obtener respuestas:", respuestasError);
        continue; // Skip this result but continue with others
      }

      // Skip recalculation for manually graded exams (no answers in the system)
      if (!respuestas || respuestas.length === 0) {
        if (DEBUG)
          _logger.log(
            `Omitiendo recálculo para resultado ${resultado.id}: evaluación manual`
          );
        continue;
      }

      // Define a type for the respuesta object structure
      type Respuesta = {
        id: string;
        pregunta_id: string;
        opcion_id: string;
        opciones_respuesta: { es_correcta: boolean };
        pregunta: { habilitada: boolean };
      };

      // Type assertion to make TypeScript happy
      const respuestasTyped = respuestas as unknown as Respuesta[];

      // Calculate new score considering only enabled questions
      const habilitadasTotal = respuestasTyped.filter(
        (r) => r.pregunta.habilitada
      ).length;
      const correctasHabilitadas = respuestasTyped.filter(
        (r) => r.pregunta.habilitada && r.opciones_respuesta.es_correcta
      ).length;

      const porcentaje =
        habilitadasTotal > 0
          ? (correctasHabilitadas / habilitadasTotal) * 100
          : 0;

      const puntajeObtenido =
        habilitadasTotal > 0
          ? (correctasHabilitadas / habilitadasTotal) * 5
          : 0;

      // Update the result score
      const { error: updateResultError } = await supabase
        .from("resultados_examen")
        .update({
          puntaje_obtenido: puntajeObtenido,
          porcentaje: porcentaje,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resultado.id);

      if (updateResultError && DEBUG) {
        console.error("Error al actualizar resultado:", updateResultError);
      }

      // Update each student answer to reflect correct/incorrect
      for (const respuesta of respuestasTyped) {
        if (respuesta.pregunta_id === questionId) {
          const esCorrecta = respuesta.opcion_id === optionId;

          const { error: updateRespuestaError } = await supabase
            .from("respuestas_estudiante")
            .update({ es_correcta: esCorrecta })
            .eq("id", respuesta.id);

          if (updateRespuestaError && DEBUG) {
            console.error(
              "Error al actualizar respuesta de estudiante:",
              updateRespuestaError
            );
          }
        }
      }
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Respuesta correcta actualizada y calificaciones recalculadas",
    });
  } catch (error: unknown) {
    if (DEBUG) {
      console.error("Error al procesar la solicitud:", error);
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
