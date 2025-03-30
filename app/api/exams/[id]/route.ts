import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Manejar correctamente los parámetros en Next.js 14
    params = await Promise.resolve(params);
    const examId = params.id;
    
    console.log('API /exams/[id]: Endpoint accedido');
    console.log(`ID recibido: ${examId}`);
    console.log(`URL completa: ${req.url}`);
  
    return NextResponse.json({
      message: 'Ruta dinámica funcionando correctamente',
      id: examId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API /exams/[id]: Error:', error);
    return NextResponse.json({
      error: 'Error al procesar la solicitud',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 