import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

// Definir interfaces para tipado
interface OpcionRespuesta {
  texto: string;
  esCorrecta: boolean;
  id?: string;
  orden?: number;
}

interface Pregunta {
  id?: string;
  texto: string;
  tipo: number;
  puntaje: number;
  retroalimentacion?: string;
  habilitada?: boolean;
  orden?: number;
  opciones: OpcionRespuesta[];
}

interface ExamenData {
  titulo: string;
  descripcion: string;
  duracion_minutos: number;
  puntaje_total: number;
  materia_id: string;
  grupo_id?: string;
  estado?: string;
  preguntas: Pregunta[];
  instrucciones?: string;
  fecha_hora_inicio?: string;
  fecha_hora_fin?: string;
  intentos_permitidos?: number;
  shuffle_preguntas?: boolean;
  formato_distribucion?: string;
  mostrar_resultados?: boolean;
  password?: string;
}

// Crear cliente de Supabase para el servidor usando SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Endpoint de diagnóstico para verificar que las rutas base de API están accesibles
export async function GET(req: NextRequest) {
  console.log('API /exams: Endpoint raíz accedido');
  
  return NextResponse.json({
    message: 'API de exámenes funcionando correctamente',
    endpoints: [
      { path: '/api/exams', description: 'Endpoint raíz (este)' },
      { path: '/api/exams/[id]', description: 'Endpoint de información básica de examen' },
      { path: '/api/exams/[id]/details', description: 'Detalles completos de examen' }
    ],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    // Obtener el token de autorización del header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener los datos del body
    const data = await req.json() as ExamenData;
    const { titulo, descripcion, duracion_minutos, puntaje_total, materia_id, preguntas, grupo_id } = data;

    // Validar que todas las preguntas tengan al menos una opción correcta y que haya al menos dos opciones válidas con texto
    for (const pregunta of preguntas) {
      // Filtrar opciones vacías
      const opcionesValidas = pregunta.opciones.filter((opcion) => opcion.texto.trim() !== '');
      
      // Verificar que haya al menos dos opciones válidas
      if (opcionesValidas.length < 2) {
        return NextResponse.json(
          { error: 'Cada pregunta debe tener al menos dos opciones válidas' },
          { status: 400 }
        );
      }
      
      // Verificar que haya al menos una opción correcta
      const tieneOpcionCorrecta = opcionesValidas.some((opcion) => opcion.esCorrecta);
      if (!tieneOpcionCorrecta) {
        return NextResponse.json(
          { error: 'Cada pregunta debe tener al menos una opción correcta' },
          { status: 400 }
        );
      }
    }

    // Obtener el profesor_id del token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autorizado' }, { status: 401 });
    }

    // 1. Crear el examen
    const { data: exam, error: examError } = await supabase
      .from('examenes')
      .insert({
        titulo,
        descripcion,
        duracion_minutos,
        puntaje_total,
        materia_id,
        profesor_id: user.id,
        estado: 'borrador',
        instrucciones: data.instrucciones,
        fecha_hora_inicio: data.fecha_hora_inicio,
        fecha_hora_fin: data.fecha_hora_fin,
        intentos_permitidos: data.intentos_permitidos,
        shuffle_preguntas: data.shuffle_preguntas,
        formato_distribucion: data.formato_distribucion,
        mostrar_resultados: data.mostrar_resultados,
        password: data.password,
      })
      .select()
      .single();

    if (examError) throw examError;

    // 2. Si se proporcionó un grupo_id, asignar el examen al grupo
    if (grupo_id) {
      const { error: asignacionError } = await supabase
        .from('examen_grupo')
        .insert({
          examen_id: exam.id,
          grupo_id: grupo_id,
          duracion_minutos: duracion_minutos,
          estado: 'borrador' // Inicialmente en borrador, cambiará a 'programado' cuando se publique el examen
        });

      if (asignacionError) throw asignacionError;
    }

    // 3. Crear las preguntas
    const preguntasConExamenId = preguntas.map((pregunta, index) => ({
      examen_id: exam.id,
      texto: pregunta.texto,
      tipo_id: pregunta.tipo,
      puntaje: parseFloat(pregunta.puntaje.toFixed(4)), // Asegurar 4 cifras significativas
      retroalimentacion: pregunta.retroalimentacion,
      habilitada: true,
      orden: index + 1,
    }));

    const { data: preguntasCreadas, error: preguntasError } = await supabase
      .from('preguntas')
      .insert(preguntasConExamenId)
      .select();

    if (preguntasError) throw preguntasError;

    // 4. Crear las opciones de respuesta para cada pregunta
    for (let i = 0; i < preguntasCreadas.length; i++) {
      const pregunta = preguntasCreadas[i];
      const opcionesOriginales = preguntas[i].opciones;

      // Filtrar opciones vacías y asignar orden secuencial solo a las válidas
      const opcionesConPreguntaId = opcionesOriginales
        .filter((opcion) => opcion.texto.trim() !== '')
        .map((opcion, index) => ({
          pregunta_id: pregunta.id,
          texto: opcion.texto,
          es_correcta: opcion.esCorrecta,
          orden: index + 1,
        }));

      const { error: opcionesError } = await supabase
        .from('opciones_respuesta')
        .insert(opcionesConPreguntaId);

      if (opcionesError) throw opcionesError;
    }

    return NextResponse.json({
      message: 'Examen creado correctamente',
      id: exam.id,
    });

  } catch (error) {
    console.error('API /exams POST: Error:', error);
    return NextResponse.json({
      error: 'Error al crear el examen',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 