export type ComponentType = 'examen' | 'proyecto' | 'quiz' | 'trabajo';

export interface GradingComponent {
  id?: string;
  nombre: string;
  porcentaje: number;
  periodo_id: string;
  tipo: ComponentType;
}

export interface GradingPeriod {
  id?: string;
  nombre: string;
  porcentaje: number;
  orden: number;
  esquema_id: string;
  fecha_inicio: string; // Formato YYYY-MM-DD
  fecha_fin: string;    // Formato YYYY-MM-DD
  componentes: GradingComponent[];
}

export interface GradingScheme {
  id?: string;
  grupo_id: string;
  nombre?: string;
  fecha_inicio: string; // Formato YYYY-MM-DD
  fecha_fin: string;    // Formato YYYY-MM-DD
  periodos: GradingPeriod[];
} 