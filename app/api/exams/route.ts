import { NextRequest, NextResponse } from 'next/server';

// Endpoint de diagnóstico para verificar que las rutas base de API están accesibles
export async function GET(req: NextRequest) {
  console.log('API /exams: Endpoint raíz accedido');
  
  return NextResponse.json({
    message: 'API de exámenes funcionando correctamente',
    endpoints: [
      { path: '/api/exams', description: 'Endpoint raíz (este)' },
      { path: '/api/exams/[id]', description: 'Endpoint de información básica de examen' },
      { path: '/api/exams/[id]/details', description: 'Detalles completos de examen' },
      { path: '/api/exams/simple-details', description: 'Detalles simplificados (fallback)' }
    ],
    timestamp: new Date().toISOString()
  });
} 