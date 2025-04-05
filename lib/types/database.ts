export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Calificacion {
  id: string;
  estudiante_id: string;
  componente_id: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface ComponenteCalificacion {
  id: string;
  periodo_id: string;
  nombre: string;
  porcentaje: number;
  tipo: string;
  created_at: string;
  updated_at: string;
}

export interface Periodo {
  id: string;
  esquema_id: string;
  nombre: string;
  porcentaje: number;
  orden: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Estudiante {
  id: string;
  nombre_completo: string;
  identificacion: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface EsquemaCalificacion {
  id: string;
  grupo_id: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  es_activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Materia {
  id: string;
  nombre: string;
  descripcion: string | null;
  entidad_id: string;
  profesor_id: string;
  created_at: string;
  updated_at: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  entidad_id: string;
  materia_id: string;
  profesor_id: string;
  estado: string;
  año_escolar: string | null;
  periodo_escolar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      aplicaciones_examen: {
        Row: {
          created_at: string
          estado: string
          examen_id: string
          fecha_aplicacion: string
          grupo_id: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          examen_id: string
          fecha_aplicacion: string
          grupo_id: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          examen_id?: string
          fecha_aplicacion?: string
          grupo_id?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aplicaciones_examen_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicaciones_examen_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          }
        ]
      }
      calificaciones: {
        Row: Calificacion;
      }
      componentes_calificacion: {
        Row: ComponenteCalificacion;
      }
      entidades_educativas: {
        Row: {
          ciudad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          pais: string | null
          telefono: string | null
          tipo: string
          updated_at: string
          website: string | null
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          pais?: string | null
          telefono?: string | null
          tipo: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          pais?: string | null
          telefono?: string | null
          tipo?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      esquemas_calificacion: {
        Row: EsquemaCalificacion;
      }
      estudiante_grupo: {
        Row: {
          created_at: string
          estudiante_id: string
          grupo_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estudiante_id: string
          grupo_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estudiante_id?: string
          grupo_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudiante_grupo_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudiante_grupo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          }
        ]
      }
      estudiantes: {
        Row: Estudiante;
      }
      examenes: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: string
          id: string
          materia_id: string
          nombre: string
          profesor_id: string
          tiempo_limite: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          materia_id: string
          nombre: string
          profesor_id: string
          tiempo_limite?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          materia_id?: string
          nombre?: string
          profesor_id?: string
          tiempo_limite?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "examenes_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examenes_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          }
        ]
      }
      grupos: {
        Row: {
          año_escolar: string | null
          created_at: string
          descripcion: string | null
          entidad_id: string
          estado: string
          id: string
          materia_id: string
          nombre: string
          periodo_escolar: string | null
          profesor_id: string
          updated_at: string
        }
        Insert: {
          año_escolar?: string | null
          created_at?: string
          descripcion?: string | null
          entidad_id: string
          estado?: string
          id?: string
          materia_id: string
          nombre: string
          periodo_escolar?: string | null
          profesor_id: string
          updated_at?: string
        }
        Update: {
          año_escolar?: string | null
          created_at?: string
          descripcion?: string | null
          entidad_id?: string
          estado?: string
          id?: string
          materia_id?: string
          nombre?: string
          periodo_escolar?: string | null
          profesor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_entidad_id_fkey"
            columns: ["entidad_id"]
            isOneToOne: false
            referencedRelation: "entidades_educativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          }
        ]
      }
      materias: {
        Row: {
          created_at: string
          descripcion: string | null
          entidad_id: string
          id: string
          nombre: string
          profesor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          entidad_id: string
          id?: string
          nombre: string
          profesor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          entidad_id?: string
          id?: string
          nombre?: string
          profesor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materias_entidad_id_fkey"
            columns: ["entidad_id"]
            isOneToOne: false
            referencedRelation: "entidades_educativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materias_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          }
        ]
      }
      opciones_respuesta: {
        Row: {
          correcta: boolean
          created_at: string
          id: string
          pregunta_id: string
          texto: string
          updated_at: string
        }
        Insert: {
          correcta: boolean
          created_at?: string
          id?: string
          pregunta_id: string
          texto: string
          updated_at?: string
        }
        Update: {
          correcta?: boolean
          created_at?: string
          id?: string
          pregunta_id?: string
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opciones_respuesta_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          }
        ]
      }
      periodos_calificacion: {
        Row: Periodo;
      }
      preguntas: {
        Row: {
          created_at: string
          descripcion: string | null
          examen_id: string
          id: string
          imagen_url: string | null
          orden: number
          puntos: number
          texto: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          examen_id: string
          id?: string
          imagen_url?: string | null
          orden: number
          puntos: number
          texto: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          examen_id?: string
          id?: string
          imagen_url?: string | null
          orden?: number
          puntos?: number
          texto?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes"
            referencedColumns: ["id"]
          }
        ]
      }
      profesores: {
        Row: {
          apellidos: string
          created_at: string
          email: string
          id: string
          identificacion: string
          nombres: string
          updated_at: string
        }
        Insert: {
          apellidos: string
          created_at?: string
          email: string
          id?: string
          identificacion: string
          nombres: string
          updated_at?: string
        }
        Update: {
          apellidos?: string
          created_at?: string
          email?: string
          id?: string
          identificacion?: string
          nombres?: string
          updated_at?: string
        }
        Relationships: []
      }
      respuestas_estudiante: {
        Row: {
          aplicacion_id: string
          created_at: string
          estudiante_id: string
          id: string
          opcion_id: string | null
          pregunta_id: string
          updated_at: string
        }
        Insert: {
          aplicacion_id: string
          created_at?: string
          estudiante_id: string
          id?: string
          opcion_id?: string | null
          pregunta_id: string
          updated_at?: string
        }
        Update: {
          aplicacion_id?: string
          created_at?: string
          estudiante_id?: string
          id?: string
          opcion_id?: string | null
          pregunta_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_estudiante_aplicacion_id_fkey"
            columns: ["aplicacion_id"]
            isOneToOne: false
            referencedRelation: "aplicaciones_examen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_estudiante_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_estudiante_opcion_id_fkey"
            columns: ["opcion_id"]
            isOneToOne: false
            referencedRelation: "opciones_respuesta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_estudiante_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          }
        ]
      }
      resultados_examen: {
        Row: {
          aplicacion_id: string
          calificacion: number
          created_at: string
          estudiante_id: string
          id: string
          updated_at: string
        }
        Insert: {
          aplicacion_id: string
          calificacion: number
          created_at?: string
          estudiante_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          aplicacion_id?: string
          calificacion?: number
          created_at?: string
          estudiante_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultados_examen_aplicacion_id_fkey"
            columns: ["aplicacion_id"]
            isOneToOne: false
            referencedRelation: "aplicaciones_examen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_examen_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          }
        ]
      }
      tipos_pregunta: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id: string
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      versiones_examen: {
        Row: {
          created_at: string
          examen_id: string
          id: string
          numero: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          examen_id: string
          id?: string
          numero: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          examen_id?: string
          id?: string
          numero?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "versiones_examen_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_profesor_of_grupo: {
        Args: {
          grupo_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  calificaciones: Calificacion;
  componentes_calificacion: ComponenteCalificacion;
  periodos_calificacion: Periodo;
  estudiantes: Estudiante;
  esquemas_calificacion: EsquemaCalificacion;
} 