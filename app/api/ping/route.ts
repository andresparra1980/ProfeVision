import { NextResponse } from 'next/server';

export async function HEAD() {
  // Simplemente devolver un 200 OK para confirmar conectividad
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function GET() {
  // Devolver un payload mínimo para confirmar conectividad
  return NextResponse.json(
    { status: 'ok', timestamp: Date.now() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
} 