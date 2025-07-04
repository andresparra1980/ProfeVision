# Instrucciones de Configuración para ProfeVision OMR

## Requisitos previos

1. Tener un entorno Python configurado con los paquetes necesarios
2. Tener la base de datos Supabase configurada
3. Tener el script `omr_standalone.py` en la raíz del proyecto

## Preparación del entorno Python

1. Crea un entorno virtual de Python en la raíz del proyecto:

```bash
python -m venv omr_env
```

2. Activa el entorno virtual:
```bash
# En Windows
omr_env\Scripts\activate

# En Linux/Mac
source omr_env/bin/activate
```

3. Instala las dependencias necesarias:
```bash
pip install opencv-python numpy pillow pyzbar
```

## Configuración de la base de datos

1. En Supabase, navega al Editor SQL y ejecuta el script `sql/create_exam_scans_table.sql` para crear la tabla necesaria para almacenar los resultados del escaneo.

2. Asegúrate de que las políticas RLS (Row Level Security) están configuradas correctamente para permitir el acceso a los datos.

## Variables de entorno

Asegúrate de tener las siguientes variables de entorno configuradas en tu archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
```

## Estructura de directorios

Asegúrate de que existen los siguientes directorios:

```
/public/uploads - Para almacenar las imágenes escaneadas
/tmp - Para almacenar archivos temporales durante el procesamiento
```

## Probar la funcionalidad

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Navega a la página de escaneo de un examen existente (por ejemplo: `/dashboard/exams/[id]/scan`)

3. Captura una imagen de una hoja de respuestas usando la cámara

4. Verifica que la imagen se procese correctamente y se muestren los resultados en la interfaz

## Resolución de problemas

### La tabla exam_scans no existe

Si recibes un error indicando que la tabla `exam_scans` no existe, ejecuta el script SQL mencionado anteriormente.

### Error al procesar la imagen

Asegúrate de que:
- El script `omr_standalone.py` existe en la raíz del proyecto
- El entorno virtual `omr_env` está correctamente configurado
- La imagen capturada tiene suficiente calidad y buena iluminación

### Error de permisos en Supabase

Si recibes errores relacionados con RLS o permisos:
1. Verifica que estás usando el `SUPABASE_SERVICE_ROLE_KEY` para operaciones que requieren privilegios elevados
2. Revisa las políticas RLS configuradas para la tabla `exam_scans` 