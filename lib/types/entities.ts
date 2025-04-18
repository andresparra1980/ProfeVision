/**
 * Types and interfaces for educational entities in ProfeVision
 */

import type { Database } from "./database";

/**
 * Base types from database schema
 */
type Materia = Database["public"]["Tables"]["materias"]["Row"];
type Grupo = Database["public"]["Tables"]["grupos"]["Row"];
type Profesor = Database["public"]["Tables"]["profesores"]["Row"];

/**
 * Base educational entity type from database schema
 */
export interface EducationalEntityRow {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

/**
 * Educational entity type with optional relationships
 */
export interface EducationalEntity extends EducationalEntityRow {
  materias?: Materia[];
  grupos?: Grupo[];
  profesores?: Profesor[];
}

/**
 * Educational entity creation payload
 */
export interface CreateEducationalEntityPayload {
  nombre: string;
  tipo: string;
  estado?: string;
}

/**
 * Educational entity update payload
 */
export interface UpdateEducationalEntityPayload {
  nombre?: string;
  tipo?: string;
  estado?: string;
}

/**
 * Professor-Entity relationship
 */
export interface ProfesorEntidadRelation {
  entidad_id: string;
  entidades_educativas: EducationalEntity;
}

/**
 * Entity type options
 */
export const ENTITY_TYPES = {
  COLEGIO: "colegio",
  UNIVERSIDAD: "universidad",
  INSTITUTO: "instituto",
  OTRO: "otro",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/**
 * Entity status options
 */
export const ENTITY_STATUS = {
  ACTIVO: "activo",
  INACTIVO: "inactivo",
  ARCHIVADO: "archivado",
} as const;

export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];

/**
 * Entity search filters
 */
export interface EntitySearchFilters {
  nombre?: string;
  tipo?: (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];
  estado?: (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];
}

/**
 * Entity API response
 */
export interface EntityApiResponse {
  data: EducationalEntity[];
  count: number;
  error: string | null;
}
