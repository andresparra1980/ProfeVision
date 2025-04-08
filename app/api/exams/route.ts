import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const data = await req.json();
    const { titulo, descripcion, duracion_minutos, puntaje_total, materia_id, preguntas } = data;

    // Validar que todas las preguntas tienen al menos una opción correcta
    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      const tieneOpcionCorrecta = pregunta.opciones.some((opcion: any) => opcion.esCorrecta);
      
      if (!tieneOpcionCorrecta) {
        return NextResponse.json({ 
          error: `La pregunta ${i + 1} debe tener al menos una opción correcta` 
        }, { status: 400 });
      }
      
      // Verificar que tenga opciones válidas (con texto)
      const opcionesValidas = pregunta.opciones.filter((opcion: any) => opcion.texto.trim() !== '');
      if (opcionesValidas.length < 2) {
        return NextResponse.json({ 
          error: `La pregunta ${i + 1} debe tener al menos dos opciones con texto` 
        }, { status: 400 });
      }
      
      // Actualizar las opciones para solo incluir las válidas
      pregunta.opciones = opcionesValidas;
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
      })
      .select()
      .single();

    if (examError) throw examError;

    // 2. Crear las preguntas
    const preguntasConExamenId = preguntas.map((pregunta: any, index: number) => ({
      examen_id: exam.id,
      texto: pregunta.texto,
      tipo_id: pregunta.tipo,
      puntaje: pregunta.puntaje,
      retroalimentacion: pregunta.retroalimentacion,
      habilitada: true,
      orden: index + 1,
    }));

    const { data: preguntasCreadas, error: preguntasError } = await supabase
      .from('preguntas')
      .insert(preguntasConExamenId)
      .select();

    if (preguntasError) throw preguntasError;

    // 3. Crear las opciones de respuesta para cada pregunta
    for (let i = 0; i < preguntasCreadas.length; i++) {
      const pregunta = preguntasCreadas[i];
      const opcionesOriginales = preguntas[i].opciones;

      // Filtrar opciones vacías y asignar orden secuencial solo a las válidas
      const opcionesConPreguntaId = opcionesOriginales
        .filter((opcion: any) => opcion.texto.trim() !== '')
        .map((opcion: any, index: number) => ({
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