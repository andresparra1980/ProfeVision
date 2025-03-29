import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Obtener el ID del examen de la URL
    const url = new URL(req.url);
    const examId = url.searchParams.get('id');
    
    if (!examId) {
      return NextResponse.json(
        { error: 'ID de examen no proporcionado en parámetros de consulta' },
        { status: 400 }
      );
    }
    
    console.log(`API simple: Solicitando detalles del examen ${examId}`);
    
    // Devolver datos ficticios para pruebas
    const mockData = {
      id: examId,
      titulo: 'Examen de Prueba',
      descripcion: 'Descripción de prueba',
      instrucciones: 'Instrucciones de prueba',
      materia_id: 'materia-uuid-123',
      profesor_id: 'profesor-uuid-123',
      estado: 'publicado',
      duracion_minutos: 60,
      materia: {
        id: 'materia-uuid-123',
        nombre: 'Física I (Mock)'
      }
    };
    
    // Simular un delay para ver si hay problemas de tiempo de carga
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('API simple: Devolviendo datos de prueba');
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error en API simple de detalles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor en endpoint simple' },
      { status: 500 }
    );
  }
} 