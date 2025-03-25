export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          created_at: string
          email: string | null
          id: string
          identificacion: string
          nombre_completo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          identificacion: string
          nombre_completo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          identificacion?: string
          nombre_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      examenes: {
        Row: {
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          estado: string
          fecha_creacion: string
          id: string
          instrucciones: string | null
          materia_id: string
          profesor_id: string
          puntaje_total: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          estado?: string
          fecha_creacion?: string
          id?: string
          instrucciones?: string | null
          materia_id: string
          profesor_id: string
          puntaje_total?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          estado?: string
          fecha_creacion?: string
          id?: string
          instrucciones?: string | null
          materia_id?: string
          profesor_id?: string
          puntaje_total?: number | null
          titulo?: string
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
          id: string
          materia_id: string
          nombre: string
          profesor_id: string
          updated_at: string
        }
        Insert: {
          año_escolar?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          materia_id: string
          nombre: string
          profesor_id: string
          updated_at?: string
        }
        Update: {
          año_escolar?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          materia_id?: string
          nombre?: string
          profesor_id?: string
          updated_at?: string
        }
        Relationships: [
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
          entidad_id: string | null
          id: string
          nombre: string
          profesor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          entidad_id?: string | null
          id?: string
          nombre: string
          profesor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          entidad_id?: string | null
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
          created_at: string
          es_correcta: boolean
          id: string
          orden: number
          pregunta_id: string
          texto: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_correcta?: boolean
          id?: string
          orden?: number
          pregunta_id: string
          texto: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_correcta?: boolean
          id?: string
          orden?: number
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
      preguntas: {
        Row: {
          created_at: string
          dificultad: string | null
          examen_id: string
          id: string
          orden: number
          puntaje: number
          retroalimentacion: string | null
          texto: string
          tipo_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dificultad?: string | null
          examen_id: string
          id?: string
          orden?: number
          puntaje?: number
          retroalimentacion?: string | null
          texto: string
          tipo_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dificultad?: string | null
          examen_id?: string
          id?: string
          orden?: number
          puntaje?: number
          retroalimentacion?: string | null
          texto?: string
          tipo_id?: string
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
      profesor_entidad: {
        Row: {
          created_at: string
          departamento: string | null
          entidad_id: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          profesor_id: string
          rol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          departamento?: string | null
          entidad_id: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          profesor_id: string
          rol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          departamento?: string | null
          entidad_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          profesor_id?: string
          rol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesor_entidad_entidad_id_fkey"
            columns: ["entidad_id"]
            isOneToOne: false
            referencedRelation: "entidades_educativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesor_entidad_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          }
        ]
      }
      profesores: {
        Row: {
          biografia: string | null
          cargo: string | null
          created_at: string
          foto_url: string | null
          id: string
          nombre_completo: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          biografia?: string | null
          cargo?: string | null
          created_at?: string
          foto_url?: string | null
          id: string
          nombre_completo: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          biografia?: string | null
          cargo?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nombre_completo?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesores_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      respuestas_estudiante: {
        Row: {
          created_at: string
          es_correcta: boolean | null
          id: string
          opcion_id: string | null
          pregunta_id: string
          puntaje_obtenido: number | null
          resultado_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          opcion_id?: string | null
          pregunta_id: string
          puntaje_obtenido?: number | null
          resultado_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          opcion_id?: string | null
          pregunta_id?: string
          puntaje_obtenido?: number | null
          resultado_id?: string
          updated_at?: string
        }
        Relationships: [
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
          },
          {
            foreignKeyName: "respuestas_estudiante_resultado_id_fkey"
            columns: ["resultado_id"]
            isOneToOne: false
            referencedRelation: "resultados_examen"
            referencedColumns: ["id"]
          }
        ]
      }
      resultados_examen: {
        Row: {
          aplicacion_id: string
          created_at: string
          estado: string
          estudiante_id: string
          fecha_calificacion: string | null
          id: string
          porcentaje: number | null
          puntaje_obtenido: number | null
          tiempo_utilizado: number | null
          updated_at: string
          version_id: string
        }
        Insert: {
          aplicacion_id: string
          created_at?: string
          estado?: string
          estudiante_id: string
          fecha_calificacion?: string | null
          id?: string
          porcentaje?: number | null
          puntaje_obtenido?: number | null
          tiempo_utilizado?: number | null
          updated_at?: string
          version_id: string
        }
        Update: {
          aplicacion_id?: string
          created_at?: string
          estado?: string
          estudiante_id?: string
          fecha_calificacion?: string | null
          id?: string
          porcentaje?: number | null
          puntaje_obtenido?: number | null
          tiempo_utilizado?: number | null
          updated_at?: string
          version_id?: string
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
          },
          {
            foreignKeyName: "resultados_examen_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "versiones_examen"
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
          codigo: string
          created_at: string
          examen_id: string
          id: string
          orden_opciones: Json | null
          orden_preguntas: Json | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          examen_id: string
          id?: string
          orden_opciones?: Json | null
          orden_preguntas?: Json | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          examen_id?: string
          id?: string
          orden_opciones?: Json | null
          orden_preguntas?: Json | null
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
    Views: {}
    Functions: {
      es_miembro_entidad: {
        Args: {
          entidad_id: string
        }
        Returns: boolean
      }
      es_profesor_actual: {
        Args: {
          profesor_id: string
        }
        Returns: boolean
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
} 