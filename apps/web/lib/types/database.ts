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
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export type Student = Pick<Estudiante, 'id' | 'nombres' | 'apellidos' | 'identificacion'>;

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

export interface Profesor {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  cargo: string | null;
  biografia: string | null;
  foto_url: string | null;
  first_login_completed: boolean | null;
  onboarding_status: OnboardingStatus | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_cycle_start: string | null;
  polar_subscription_id: string | null;
  polar_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStatus {
  wizard_completed?: boolean;
  wizard_step?: number;
  wizard_started_at?: string;
  wizard_completed_at?: string;
  checklist_items?: {
    exam_created?: boolean;
    exam_published?: boolean;
    pdf_exported?: boolean;
    first_scan?: boolean;
  };
  skipped?: boolean;
  skip_reason?: string;
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
        Row: {
          id: string
          estudiante_id: string
          componente_id: string
          valor: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          estudiante_id: string
          componente_id: string
          valor: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          estudiante_id?: string
          componente_id?: string
          valor?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      componentes_calificacion: {
        Row: {
          id: string
          periodo_id: string
          nombre: string
          porcentaje: number
          tipo: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          periodo_id: string
          nombre: string
          porcentaje: number
          tipo: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          periodo_id?: string
          nombre?: string
          porcentaje?: number
          tipo?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Row: {
          id: string
          grupo_id: string
          nombre: string
          descripcion: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          es_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grupo_id: string
          nombre: string
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          es_activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          grupo_id?: string
          nombre?: string
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          es_activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Row: {
          id: string
          nombres: string
          apellidos: string
          identificacion: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombres: string
          apellidos: string
          identificacion: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombres?: string
          apellidos?: string
          identificacion?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      examenes: {
        Row: {
          id: string
          titulo: string
          descripcion: string | null
          instrucciones: string | null
          materia_id: string
          profesor_id: string
          estado: string
          fecha_creacion: string
          duracion_minutos: number | null
          puntaje_total: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descripcion?: string | null
          instrucciones?: string | null
          materia_id: string
          profesor_id: string
          estado?: string
          fecha_creacion?: string
          duracion_minutos?: number | null
          puntaje_total?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descripcion?: string | null
          instrucciones?: string | null
          materia_id?: string
          profesor_id?: string
          estado?: string
          fecha_creacion?: string
          duracion_minutos?: number | null
          puntaje_total?: number | null
          created_at?: string
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
      examen_grupo: {
        Row: {
          id: string
          examen_id: string
          grupo_id: string
          fecha_aplicacion: string | null
          duracion_minutos: number | null
          estado: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          examen_id: string
          grupo_id: string
          fecha_aplicacion?: string | null
          duracion_minutos?: number | null
          estado?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          examen_id?: string
          grupo_id?: string
          fecha_aplicacion?: string | null
          duracion_minutos?: number | null
          estado?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examen_grupo_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examen_grupo_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
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
          id: string
          pregunta_id: string
          texto: string
          es_correcta: boolean
          orden: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pregunta_id: string
          texto: string
          es_correcta?: boolean
          orden?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pregunta_id?: string
          texto?: string
          es_correcta?: boolean
          orden?: number
          created_at?: string
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
        Row: {
          id: string
          esquema_id: string
          nombre: string
          porcentaje: number
          orden: number
          fecha_inicio: string | null
          fecha_fin: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          esquema_id: string
          nombre: string
          porcentaje: number
          orden: number
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          esquema_id?: string
          nombre?: string
          porcentaje?: number
          orden?: number
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      preguntas: {
        Row: {
          id: string
          examen_id: string
          texto: string
          tipo_id: string
          puntaje: number
          dificultad: string | null
          retroalimentacion: string | null
          orden: number
          habilitada: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          examen_id: string
          texto: string
          tipo_id: string
          puntaje?: number
          dificultad?: string | null
          retroalimentacion?: string | null
          orden?: number
          habilitada?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          examen_id?: string
          texto?: string
          tipo_id?: string
          puntaje?: number
          dificultad?: string | null
          retroalimentacion?: string | null
          orden?: number
          habilitada?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_examen_id_fkey"
            columns: ["examen_id"]
            isOneToOne: false
            referencedRelation: "examenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_pregunta"
            referencedColumns: ["id"]
          }
        ]
      }
      profesores: {
        Row: {
          apellidos: string
          biografia: string | null
          cargo: string | null
          created_at: string
          first_login_completed: boolean | null
          foto_url: string | null
          id: string
          nombres: string
          onboarding_status: Json | null
          polar_customer_id: string | null
          polar_subscription_id: string | null
          subscription_cycle_start: string | null
          subscription_status: string | null
          subscription_tier: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellidos?: string
          biografia?: string | null
          cargo?: string | null
          created_at?: string
          first_login_completed?: boolean | null
          foto_url?: string | null
          id: string
          nombres?: string
          onboarding_status?: Json | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          subscription_cycle_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellidos?: string
          biografia?: string | null
          cargo?: string | null
          created_at?: string
          first_login_completed?: boolean | null
          foto_url?: string | null
          id?: string
          nombres?: string
          onboarding_status?: Json | null
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          subscription_cycle_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          telefono?: string | null
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