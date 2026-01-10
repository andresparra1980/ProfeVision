# ProfeVision Mobile - Documento de Características para Desarrollo Web

## Descripción General

ProfeVision Mobile es una aplicación móvil complementaria a profevision.com que permite a los docentes calificar automáticamente exámenes de opción múltiple utilizando la cámara de su smartphone. La aplicación utiliza tecnología OMR (Optical Mark Recognition) combinada con identificación de códigos QR para procesar hojas de respuestas al instante.

---

## Disponibilidad

- **Android**: Disponible en BETA
- **iOS**: Próximamente

---

## Características Principales

### 📷 Escaneo Automático de Exámenes

- Captura de documentos con escáner nativo
- Detección automática de hojas de respuestas
- Procesamiento OMR en tiempo real
- Identificación mediante código QR único
- Calificación automática instantánea

### 🎯 Sistema de Calificación Inteligente

- Soporte para 2-4 opciones por pregunta (A-F)
- Detección de respuestas con puntajes de confianza
- Cálculo automático de porcentajes
- Colores codificados según rendimiento:
  - Verde: ≥80%
  - Amarillo: ≥60%
  - Rojo: <60%

### 📊 Dashboard Principal

- Perfil del docente con foto y cargo
- Métricas de rendimiento:
  - Total de exámenes calificados
  - Tiempo ahorrado (96.7% más rápido)
  - Barra de progreso visual
- Uso del plan:
  - Generaciones de IA utilizadas
  - Escaneos de exámenes utilizados
  - Contador de días para reinicio del ciclo

### 📚 Gestión de Materias y Grupos

- Visualización jerárquica: Materias → Grupos → Exámenes
- Funcionalidad de búsqueda
- Detalles de grupo:
  - Nombre del grupo
  - Año escolar/periodo
  - Conteo de estudiantes
  - Lista de exámenes asociados
- Estado activo/archivado
- Toggle para mostrar grupos archivados

### ✏️ Lista de Exámenes

- Buscar exámenes por título
- Tarjetas de examen con:
  - Título del examen
  - Nombre de la materia
  - Cantidad de preguntas
  - Estado (Borrador, Publicado, Cerrado, Archivado)
  - Fecha de creación
- Botón "Ver Resultados" por examen

### 📈 Resultados y Análisis

- Tarjeta de detalles del examen
- Estadísticas resumidas:
  - Puntaje total
  - Estudiantes calificados
  - Puntaje promedio
  - Puntaje más alto
  - Puntaje más bajo
- Lista de resultados de estudiantes:
  - Nombre (apellido, nombre)
  - Número de ID
  - Puntaje obtenido
  - Porcentaje
- Modal de respuestas detalladas:
  - Desglose pregunta por pregunta
  - Cuadrícula de opciones (A-F)
  - Indicadores de correcto/incorrecto
  - Respuestas codificadas por color
- Búsqueda por nombre o ID

### ⚙️ Configuración

#### Apariencia

- Toggle de modo oscuro
- Tema persistente

#### Selección de Idioma

- Español (Español) - Predeterminado
- English
- Français (Francés)
- Português (BR) - Portugués de Brasil
- Detección automática de idioma del dispositivo

#### Cuenta

- Email (solo lectura)
- Cerrar sesión

#### Actualizaciones

- Verificación de actualizaciones OTA
- Instalación directa de actualizaciones
- Versión actual y número de build
- Indicador de disponibilidad de actualización

---

## Flujo de Escaneo (5 Pasos)

### Paso 1: Instrucciones

- Indicador de uso de escaneo con barra de progreso
- Colores codificados (verde/amarillo/rojo)
- 4 consejos de escaneo con iconos:
  - Colocar hoja en superficie oscura
  - Asegurar buena iluminación
  - Las 4 esquinas visibles
  - Código QR visible
- Bloqueo si se alcanzó el límite

### Paso 2: Captura de Imagen

- Lanzamiento del escáner de documentos nativo
- Implementación específica por plataforma:
  - Android: MLKit con captura automática
  - iOS: VisionKit escáner nativo
- Avance automático al procesamiento
- Sin vista previa intermedia

### Paso 3: Procesamiento

- Subida de imagen a API OMR
- Indicador de progreso en tiempo real
- Detección simultánea de QR y respuestas
- Obtención de detalles del examen y estudiante
- Cálculo del puntaje en paralelo
- Opción "Tomar otra foto"

### Paso 4: Resultados

- Información de entidad: materia, examen, estudiante, grupo
- Tarjeta de puntaje con colores codificados
- Cuadrícula de respuestas por letra (A-F):
  - Azul (A), Verde (B), Amarillo (C), Púrpura (D)
- Leyenda correcto/incorrecto/vacío
- Advertencia de examen duplicado
- Advertencia de discrepancia en respuestas
- Opción de re-tomar

### Paso 5: Confirmación

- Mensaje de éxito
- Resumen (estudiante, examen, puntaje)
- 3 botones de acción:
  1. Ver Resultados
  2. Escanear Otro
  3. Ir al Inicio

---

## Beneficios para el Usuario

### ⏰ Ahorro de Tiempo

- 10 segundos vs 5 minutos por examen
- 96.7% más rápido que la calificación manual
- Calificación automática instantánea

### 🎯 Precisión

- Elimina errores humanos en la calificación
- Detección automática de duplicados
- Verificación de propiedad del examen

### 🔒 Seguridad

- Identificación única por código QR
- Verificación de ownership del examen
- Integración con profevision.com

### 📱 Conveniencia

- Calificación desde el celular
- Procesamiento en tiempo real
- Resultados inmediatos
- Sincronización con la plataforma web

---

## Sistema de Suscripción por Niveles

### GRATIS

- 1 generación de IA/mes
- 50 escaneos/mes
- 100 estudiantes
- 5 grupos

### PLUS / ADMIN

- Todo ilimitado

---

## Características Técnicas

### Tecnología

- Framework: React Native con Expo SDK ~54.0
- Backend: Supabase (PostgreSQL, autenticación)
- Escaneo:
  - Android: MLKit Document Scanner
  - iOS: VisionKit Document Scanner
- Procesamiento OMR: API externa (omr.profevision.com)
- Internacionalización: 4 idiomas

### Integración con profevision.com

- Base de datos compartida (Supabase)
- 25+ tablas interconectadas
- Sincronización en tiempo real
- Autenticación unificada

### Seguridad

- Row Level Security (RLS) en todas las tablas
- Acceso solo autenticado
- Manejo de permisos de cámara
- CAPTCHA en login
- Verificación de ownership

---

## Mensajes de Error Comunes

- Permiso de cámara denegado
- Cámara no disponible
- Documento no detectado
- QR no encontrado/inválido
- Examen/estudiante no encontrado
- No es owner (examen de otro docente)
- Error de red
- Procesamiento OMR fallido
- No se detectaron respuestas
- Límite de escaneo alcanzado
- Tiempo de espera agotado

---

## Lenguajes Soportados

1. 🇪🇸 Español (Español) - Predeterminado
2. 🇺🇸 English
3. 🇫🇷 Français (Francés)
4. 🇧🇷 Português (BR) - Portugués de Brasil

---

## Notas Importantes para el Desarrollo Web

1. La app es **complementaria** a profevision.com
2. Los usuarios se registran en la web, no en la app móvil
3. La autenticación es compartida entre web y móvil
4. Los resultados escaneados se guardan en la base de datos compartida
5. La app móvil requiere que el docente tenga una cuenta en profevision.com
6. Actualmente en **BETA para Android**
7. **iOS próximamente**

---

## Propuesta de Contenido para la Landing Page

### Hero Section

- Título: "Califica Exámenes con tu Cámara en Segundos"
- Subtítulo: "ProfeVision Mobile - La aplicación que transforma la calificación manual en una tarea automática y precisa"
- Call to Action: "Descargar Beta (Android)" / "Notificarme iOS"

### Beneficios Principales

- ⏰ Ahorra 96.7% de tiempo en calificación
- 📷 Escanea desde tu celular
- ✅ Calificación automática precisa
- 🔗 Sincronizado con profevision.com

### Características Destacadas

- Escaneo inteligente con OMR
- Resultados en tiempo real
- Soporte para 6 opciones (A-F)
- Estadísticas detalladas por estudiante
- 4 idiomas disponibles
- Modo oscuro incluido

### Disponibilidad

- 🤖 Android: Beta disponible ahora
- 🍎 iOS: Próximamente

### CTA Final

- "Comenzar Gratis" (dirige a registro en profevision.com)
- "Ver Demo" (opcional)

---

## Finalización del Documento

Este documento contiene todas las características y funcionalidades de ProfeVision Mobile para su integración en la página web de profevision.com. Para cualquier duda adicional sobre implementación específica, consultar el código fuente de la aplicación móvil.
