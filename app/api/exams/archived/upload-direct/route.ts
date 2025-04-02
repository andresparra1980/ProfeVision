import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Directorio para guardar las imágenes subidas
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Directorio creado: ${UPLOAD_DIR}`);
  } catch (error) {
    console.error(`Error al crear directorio: ${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("API de subida directa iniciada");
    
    // Obtener datos de la solicitud
    const body = await req.json();
    const { imageData, contentType } = body;
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }
    
    // Generar un ID único y nombre de archivo para la imagen
    const jobId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `scan_${jobId}_${timestamp}.png`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    try {
      console.log(`Guardando imagen en: ${filePath}`);
      
      // Convertir base64 a buffer
      const base64Str = imageData;
      const buffer = Buffer.from(base64Str, 'base64');
      
      // Escribir el archivo directamente al sistema de archivos
      fs.writeFileSync(filePath, buffer);
      
      // Generar URL pública (relativa a la carpeta public)
      const publicUrl = `/uploads/${fileName}`;
      
      console.log(`Imagen guardada correctamente, URL: ${publicUrl}`);
      
      // Responder con éxito
      return NextResponse.json({
        success: true,
        message: 'Imagen subida correctamente',
        jobId: jobId,
        fileUrl: publicUrl
      });
      
    } catch (saveError: any) {
      console.error('Error al guardar la imagen:', saveError);
      return NextResponse.json(
        { error: `Error al guardar la imagen: ${saveError.message}` },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error general en la API:', error);
    return NextResponse.json(
      { error: `Error inesperado: ${error.message}` },
      { status: 500 }
    );
  }
} 