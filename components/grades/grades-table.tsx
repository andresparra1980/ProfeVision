import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GradeInput } from '@/components/ui/grade-input';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponenteCalificacion, Estudiante, Periodo } from '@/lib/types/database';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Calificaciones {
  porComponente: Record<string, Record<string, number>>;
}

interface GradesTableProps {
  estudiantes: Estudiante[];
  periodos: Periodo[];
  componentes: ComponenteCalificacion[];
  calificaciones: Calificaciones;
  onGradeChange: (estudianteId: string, componenteId: string, value: number | null) => void;
  isLoading?: boolean;
  componentesBloqueados: Record<string, boolean>;
  onToggleLock: (componenteId: string) => void;
}

export function GradesTable({
  estudiantes,
  periodos,
  componentes,
  calificaciones,
  onGradeChange,
  isLoading = false,
  componentesBloqueados,
  onToggleLock,
}: GradesTableProps) {
  // Agrupar componentes por periodo
  const componentesPorPeriodo = periodos.map(periodo => ({
    periodo,
    componentes: componentes.filter(c => c.periodo_id === periodo.id)
  }));

  // Obtener calificación por componente
  const getCalificacionComponente = (estudianteId: string, componenteId: string) => {
    const calificacion = calificaciones.porComponente[estudianteId]?.[componenteId];
    return calificacion !== undefined ? calificacion : null;
  };

  // Calcular promedio del periodo
  const calcularPromedioPeriodo = (estudianteId: string, periodo: Periodo) => {
    const componentesDelPeriodo = componentes.filter(c => c.periodo_id === periodo.id);
    let suma = 0;
    let sumaPorcentajes = 0;

    for (const componente of componentesDelPeriodo) {
      const nota = getCalificacionComponente(estudianteId, componente.id);
      if (nota !== null) {
        suma += nota * componente.porcentaje;
        sumaPorcentajes += componente.porcentaje;
      }
    }

    return sumaPorcentajes > 0 ? (suma / 100) : null;
  };

  // Calcular nota final
  const calcularNotaFinal = (estudianteId: string) => {
    let suma = 0;

    for (const { periodo } of componentesPorPeriodo) {
      const promedioPeriodo = calcularPromedioPeriodo(estudianteId, periodo);
      if (promedioPeriodo !== null) {
        suma += promedioPeriodo;
      }
    }

    return suma > 0 ? suma : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Estudiante</TableHead>
            {componentesPorPeriodo.map(({ periodo, componentes }) => (
              <React.Fragment key={periodo.id}>
                {componentes.map(componente => (
                  <TableHead key={componente.id} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        {componente.nombre}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onToggleLock(componente.id)}
                        >
                          {componentesBloqueados[componente.id] ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {componente.porcentaje}%
                      </div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center bg-muted/50">
                  {periodo.nombre}
                  <div className="text-xs text-muted-foreground">
                    {periodo.porcentaje}%
                  </div>
                </TableHead>
              </React.Fragment>
            ))}
            <TableHead className="text-center bg-primary/10">Nota Final</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudiantes.map(estudiante => (
            <TableRow key={estudiante.id}>
              <TableCell className="font-medium">
                {estudiante.nombre_completo}
              </TableCell>
              {componentesPorPeriodo.map(({ periodo, componentes }) => (
                <React.Fragment key={periodo.id}>
                  {componentes.map(componente => (
                    <TableCell key={componente.id} className="text-center">
                      <GradeInput
                        value={getCalificacionComponente(estudiante.id, componente.id)}
                        onChange={(value) => onGradeChange(estudiante.id, componente.id, value)}
                        disabled={componentesBloqueados[componente.id]}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-medium bg-muted/50">
                    {calcularPromedioPeriodo(estudiante.id, periodo)?.toFixed(2) ?? '-'}
                  </TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-center font-medium bg-primary/10">
                {calcularNotaFinal(estudiante.id)?.toFixed(1) ?? '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 