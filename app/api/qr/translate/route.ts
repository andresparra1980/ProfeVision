import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Obtener variables de entorno para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface QRTranslateRequest {
  examId?: string;
  studentId?: string;
  groupId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validar credenciales de Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Faltan credenciales de Supabase' },
        { status: 500 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const data: QRTranslateRequest = await request.json();
    const { examId, studentId, groupId } = data;

    if (!examId && !studentId && !groupId) {
      return NextResponse.json(
        { error: 'Se requiere al menos un ID (examen, estudiante o grupo)' },
        { status: 400 }
      );
    }

    // Inicializar cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const result: Record<string, string | null> = {
      examName: null,
      studentName: null,
      groupName: null
    };

    // Consultas paralelas para mejorar el rendimiento
    const promises = [];

    // Consulta para obtener nombre del examen
    if (examId) {
      const examPromise = supabase
        .from('examenes')
        .select('titulo')
        .eq('id', examId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error('Error al obtener examen:', error);
          result.examName = data?.titulo || null;
        });
      promises.push(examPromise);
    }

    // Consulta para obtener nombre del estudiante
    if (studentId) {
      const studentPromise = supabase
        .from('estudiantes')
        .select('nombres, apellidos')
        .eq('id', studentId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error('Error al obtener estudiante:', error);
          result.studentName = data ? `${data.nombres} ${data.apellidos}`.trim() : null;
        });
      promises.push(studentPromise);
    }

    // Consulta para obtener nombre del grupo
    if (groupId) {
      const groupPromise = supabase
        .from('grupos')
        .select('nombre')
        .eq('id', groupId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error('Error al obtener grupo:', error);
          result.groupName = data?.nombre || null;
        });
      promises.push(groupPromise);
    }

    // Esperar a que todas las consultas se completen
    await Promise.all(promises);

    // Devolver resultado
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error en traducción de QR:', error);
    return NextResponse.json(
      { success: false, error: 'Error en traducción de datos de QR' },
      { status: 500 }
    );
  }
} 