import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database";
import logger from "@/lib/utils/logger";
import { getApiTranslator } from '@/i18n/api';
import { getPostHogClient } from '@/lib/posthog-server';
import {
  MAX_QUESTION_OPTIONS,
  MIN_QUESTION_OPTIONS,
  getQuestionOptionCountError,
} from "@/lib/exams/question-option-validation";

function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

// Endpoint de diagnóstico para verificar que las rutas base de API están accesibles
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      // Create a minimal Request for translation resolution
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.serverConfig') },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("examenes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("API /exams GET: Error al obtener exámenes:", error);
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.fetchExams') },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error("API /exams GET: Error:", error);
    const dummyReq = new Request('http://localhost/api/exams');
    return NextResponse.json(
      {
        error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.fetchExams'),
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.serverConfig') },
        { status: 500 }
      );
    }

    // Extraer el token de autorización
    const authHeader = request.headers.get("Authorization") || "";

    // Obtener el usuario desde la sesión
    const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Obtenemos una instancia con permisos de administrador para operaciones de escritura
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey
    );

    // Verificar autenticación
    const { data: userData, error: userError } =
      await supabaseAuth.auth.getUser();
    let userId: string;

    if (userError || !userData.user) {
      logger.error("API /exams POST: Error de autenticación", userError);

      // Intentar recuperar la sesión como alternativa
      const { data: sessionData } = await supabaseAuth.auth.getSession();
      if (!sessionData.session) {
        const dummyReq = new Request('http://localhost/api/exams');
        return NextResponse.json(
          { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.unauthorized') },
          { status: 401 }
        );
      }

      // Si tenemos sesión pero no usuario, usamos el ID de la sesión
      if (sessionData.session.user) {
        userId = sessionData.session.user.id;
      } else {
        const dummyReq = new Request('http://localhost/api/exams');
        return NextResponse.json(
          { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.noUser') },
          { status: 401 }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // Obtener el profesor_id (mismo que el user.id)
    const profesor_id = userId;

    // Obtener los datos del body
    const body = await request.json();
    const {
      titulo,
      descripcion,
      preguntas,
      materia_id,
      grupo_id,
      duracion_minutos,
      puntaje_total,
    } = body as {
      titulo: string;
      descripcion: string;
      preguntas: Array<{
        texto: string;
        tipo?: string;
        retroalimentacion?: string;
        opciones?: Array<{ texto: string; esCorrecta?: boolean }>;
      }>;
      materia_id: string;
      grupo_id: string;
      duracion_minutos?: number;
      puntaje_total?: number;
    };

    if (!titulo || !materia_id) {
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.missingFields') },
        { status: 400 }
      );
    }

    // Validar que hay un grupo seleccionado
    if (!grupo_id) {
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.missingGroup') },
        { status: 400 }
      );
    }

    const optionCountIssue = getQuestionOptionCountError(preguntas);
    if (optionCountIssue) {
      const { t } = await getApiTranslator(request, 'exams.base');
      return NextResponse.json(
        {
          error: interpolate(
            t(
              'errors.invalidOptionCount',
              `Question {question} must have between {min} and {max} answer options.`
            ),
            {
              question: optionCountIssue.index + 1,
              min: MIN_QUESTION_OPTIONS,
              max: MAX_QUESTION_OPTIONS,
            }
          ),
        },
        { status: 400 }
      );
    }

    logger.log("Creando examen con profesor_id:", profesor_id);

    // Insertar el examen con los nombres de columnas correctos
    const { data, error } = await supabaseAdmin
      .from("examenes")
      .insert({
        titulo: titulo,
        descripcion: descripcion,
        materia_id,
        profesor_id,
        estado: "borrador",
        duracion_minutos: duracion_minutos,
        puntaje_total: puntaje_total,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error("API /exams POST: Error al crear examen:", error);
      logger.error("Detalles del error:", error.details);
      const dummyReq = new Request('http://localhost/api/exams');
      return NextResponse.json(
        { error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.createExam') },
        { status: 500 }
      );
    }

    const examenId = data.id;

    // Crear la asociación examen-grupo
    const { error: grupoError } = await supabaseAdmin
      .from("examen_grupo")
      .insert({
        examen_id: examenId,
        grupo_id: grupo_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (grupoError) {
      logger.error(
        `Error al asociar el examen al grupo ${grupo_id}:`,
        grupoError
      );
      // Continuamos aunque haya error en la asociación
    }

    // Si hay preguntas, las procesamos
    if (preguntas && Array.isArray(preguntas) && preguntas.length > 0) {
      // Calculate points per question based on total exam points
      const totalExamPoints = puntaje_total || 5;
      const validPreguntas = preguntas.filter((p) => p.texto.trim() !== "");
      const pointsPerQuestion = parseFloat(
        (totalExamPoints / validPreguntas.length).toFixed(2)
      );

      logger.log(
        `Distribuyendo ${totalExamPoints} puntos entre ${validPreguntas.length} preguntas: ${pointsPerQuestion} por pregunta`
      );

      // Insertar cada pregunta
      for (let i = 0; i < preguntas.length; i++) {
        const pregunta = preguntas[i];

        // Verificar que la pregunta tiene texto
        if (!pregunta.texto.trim()) {
          logger.log(`Saltando pregunta ${i + 1} porque está vacía`);
          continue; // No creamos preguntas sin texto
        }

        const { data: preguntaData, error: preguntaError } = await supabaseAdmin
          .from("preguntas")
          .insert({
            examen_id: examenId,
            texto: pregunta.texto,
            tipo_id: pregunta.tipo || "opcion_multiple",
            puntaje: pointsPerQuestion, // Use the calculated points per question
            retroalimentacion: (pregunta.retroalimentacion || '').slice(0, 2000),
            orden: i + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (preguntaError) {
          logger.error(
            "API /exams POST: Error al crear pregunta:",
            preguntaError
          );
          continue; // Continuamos con las demás preguntas
        }

        // Si hay opciones, las procesamos
        if (pregunta.opciones && Array.isArray(pregunta.opciones)) {
          const opcionesValidas = pregunta.opciones.filter(
            (opcion) => opcion.texto && opcion.texto.trim() !== ""
          );
          let ordenActual = 1; // Inicializamos el contador de orden

          for (let j = 0; j < opcionesValidas.length; j++) {
            const opcion = opcionesValidas[j];

            // Solo creamos la opción si tiene texto
            if (opcion.texto && opcion.texto.trim() !== "") {
              await supabaseAdmin.from("opciones_respuesta").insert({
                pregunta_id: preguntaData.id,
                texto: opcion.texto,
                es_correcta: opcion.esCorrecta || false,
                orden: ordenActual++, // Usar y luego incrementar el contador
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    // PostHog: Capture server-side exam_created event
    try {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: profesor_id,
        event: 'exam_created',
        properties: {
          exam_id: examenId,
          question_count: preguntas?.length || 0,
          has_description: !!descripcion,
          source: 'api',
        },
      });
    } catch (posthogError) {
      logger.error("PostHog capture error:", posthogError);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error("API /exams POST: Error:", error);
    const dummyReq = new Request('http://localhost/api/exams');
    return NextResponse.json(
      {
        error: (await getApiTranslator(dummyReq, 'exams.base')).t('errors.createExam'),
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
