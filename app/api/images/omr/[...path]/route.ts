import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Endpoint para servir imágenes OMR desde la API
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruir la ruta del archivo solicitado
    const filePath = params.path.join('/');
    
    // Construir la ruta completa al archivo en el sistema
    const omrDirectory = path.join(process.cwd(), 'public', 'uploads', 'omr');
    const fullPath = path.join(omrDirectory, filePath);
    
    // Verificar que la ruta no salga del directorio OMR (prevenir path traversal)
    const normalizedFullPath = path.normalize(fullPath);
    if (!normalizedFullPath.startsWith(omrDirectory)) {
      return new NextResponse('Acceso denegado', { status: 403 });
    }
    
    // Verificar si el archivo existe
    if (!existsSync(normalizedFullPath)) {
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }
    
    // Leer el archivo
    const fileData = await readFile(normalizedFullPath);
    
    // Determinar el tipo MIME basado en la extensión
    const ext = path.extname(normalizedFullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // Configurar encabezados para caché y tipo de contenido
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Caché de 1 día
    });
    
    // Devolver la imagen con los encabezados apropiados
    return new NextResponse(fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error al servir imagen OMR:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 