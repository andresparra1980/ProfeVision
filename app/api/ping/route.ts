import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simplemente devolver un OK para mantener la conexión viva
    // No necesitamos autenticación para este endpoint ya que 
    // es solo para mantener la conexión activa
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error en el ping endpoint:', error);
    return NextResponse.json(
      { error: 'Error en el servicio' },
      { status: 500 }
    );
  }
} 