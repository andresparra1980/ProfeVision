import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession();
    
    // Si no hay sesión o la sesión expiró, devolver 401
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }
    
    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    const tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
    const isExpiringSoon = tokenExpiry && (tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000);
    
    // Devolver la información de sesión válida
    return NextResponse.json(
      { 
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        expiresAt: session.expires_at,
        isExpiringSoon,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    return NextResponse.json(
      { error: 'Error al verificar autenticación' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
} 