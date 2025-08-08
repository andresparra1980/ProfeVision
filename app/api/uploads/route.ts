import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getApiTranslator } from '@/i18n/api';

// Directorio para guardar las imágenes subidas
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Asegurarnos de que el directorio exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: (await getApiTranslator(req as any, 'uploads')).t('errors.missingImage') }, { status: 400 });
    }
    
    // Validar que sea una imagen
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: (await getApiTranslator(req as any, 'uploads')).t('errors.invalidImage') }, { status: 400 });
    }
    
    // Generar un nombre único para la imagen
    const fileExtension = image.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    // Guardar la imagen en el sistema de archivos
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    fs.writeFileSync(filePath, buffer);
    
    // Devolver la ruta relativa donde se guardó la imagen
    return NextResponse.json({ 
      success: true, 
      path: filePath,
      url: `/uploads/${fileName}`
    });
    
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    return NextResponse.json(
      { error: (await getApiTranslator(req as any, 'uploads')).t('errors.process') },
      { status: 500 }
    );
  }
} 