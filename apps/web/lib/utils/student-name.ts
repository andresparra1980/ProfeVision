/**
 * Utilities for handling student names with dynamic format support.
 * 
 * When `nombres` is NULL, `apellidos` contains the full combined name ("Apellidos y Nombres").
 * When `nombres` has a value, names are stored separately.
 */

interface StudentWithName {
  nombres: string | null;
  apellidos: string;
}

/**
 * Check if a list of students has separate name fields (nombres + apellidos)
 * or combined names (only apellidos contains full name).
 * 
 * @returns true if at least one student has `nombres` set (separate format)
 */
export function hasNombresSeparados(estudiantes: StudentWithName[]): boolean {
  return estudiantes.some(e => e.nombres !== null && e.nombres !== '');
}

/**
 * Get display name for a student.
 * 
 * @param format - 'full' returns "Nombres Apellidos" or just "Apellidos" if combined
 *               - 'lastFirst' returns "Apellidos, Nombres" or just "Apellidos" if combined
 */
export function getStudentDisplayName(
  estudiante: StudentWithName,
  format: 'full' | 'lastFirst' = 'full'
): string {
  if (!estudiante.nombres) {
    return estudiante.apellidos;
  }
  
  if (format === 'lastFirst') {
    return `${estudiante.apellidos}, ${estudiante.nombres}`;
  }
  
  return `${estudiante.nombres} ${estudiante.apellidos}`;
}

/**
 * Get the appropriate column header label based on whether names are separated.
 * 
 * @param separated - Whether names are in separate fields
 * @param field - 'apellidos' or 'nombres'
 * @param labels - Object with translated labels
 */
export function getNameColumnLabel(
  separated: boolean,
  field: 'apellidos' | 'nombres',
  labels: { apellidos: string; nombres: string; apellidosYNombres: string }
): string | null {
  if (separated) {
    return field === 'apellidos' ? labels.apellidos : labels.nombres;
  }
  
  // Combined format: only apellidos column with different label
  if (field === 'apellidos') {
    return labels.apellidosYNombres;
  }
  
  // No nombres column needed in combined format
  return null;
}
