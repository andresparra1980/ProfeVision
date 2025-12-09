export interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
}

export interface OpcionRespuesta {
  id: string;
  orden: number;
  pregunta_id: string;
  es_correcta: boolean;
}

export interface RespuestaEstudiante {
  id: string;
  pregunta_id: string;
  opcion_id: string;
  es_correcta: boolean;
  puntaje_obtenido: number;
  pregunta: {
    id: string;
    orden: number;
    num_opciones: number;
    habilitada: boolean;
    opciones_respuesta: OpcionRespuesta[];
  };
  opcion_respuesta: {
    id: string;
    orden: number;
  };
}

export interface ResultadoExamen {
  id: string;
  estudiante: Estudiante;
  puntaje_obtenido: number;
  porcentaje: number;
  fecha_calificacion: string;
  respuestas_estudiante: RespuestaEstudiante[];
  examen_escaneado?: {
    archivo_original: string;
    archivo_procesado: string;
    ruta_s3_original: string;
    ruta_s3_procesado: string;
  };
  imagenBase64?: string;
}

export interface GrupoExamen {
  id: string;
  grupo_id: string;
  nombre: string;
}

export interface ExamDetails {
  id: string;
  titulo: string;
  estado: string;
  creado_en: string;
  created_at?: string;
  puntaje_total?: number;
  materias?: {
    nombre: string;
    entidades_educativas?: {
      nombre: string;
    };
  };
  grupo_id?: string;
  grupos?: {
    id: string;
    nombre: string;
  };
  grupos_asignados?: GrupoExamen[];
  [key: string]: unknown;
}

export interface PendingUpdate {
  respuestaId: string;
  opcionId: string;
  resultadoId: string;
  preguntaOrden: number;
  nuevaLetra: string;
}
