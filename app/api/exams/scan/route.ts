import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const examData = JSON.parse(formData.get('examData') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Crear directorio de uploads si no existe
    const uploadDir = join(process.cwd(), 'uploads');
    try {
      await writeFile(join(uploadDir, '.gitkeep'), '');
    } catch (error) {
      // Ignorar error si el directorio ya existe
    }

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar archivo
    const filePath = join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: 'Archivo guardado correctamente',
      filePath: filePath,
      examData
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Error al guardar el archivo' },
      { status: 500 }
    );
  }
} 