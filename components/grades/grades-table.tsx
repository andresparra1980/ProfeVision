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
import { Lock, Unlock, FileUp, Download, Upload, ArrowUpDown, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  onImportGrades?: (componenteId: string) => void;
  onExportGrades?: (componenteId: string) => void;
  onExportPeriod?: (periodoId: string) => void;
  onExportFinal?: () => void;
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
  onImportGrades,
  onExportGrades,
  onExportPeriod,
  onExportFinal,
}: GradesTableProps) {
  // Función para calcular la nota final de un periodo para un estudiante
  const calcularNotaPeriodo = (estudiante: Estudiante, periodo: Periodo) => {
    const componentesPeriodo = componentes.filter(c => c.periodo_id === periodo.id);
    let notaFinal = 0;
    let porcentajeTotal = 0;

    componentesPeriodo.forEach(componente => {
      const nota = calificaciones.porComponente[estudiante.id]?.[componente.id] || 0;
      notaFinal += nota * (componente.porcentaje / 100);
      porcentajeTotal += componente.porcentaje;
    });

    // Si no hay componentes o el porcentaje total es 0, retornar 0
    if (componentesPeriodo.length === 0 || porcentajeTotal === 0) return 0;

    return notaFinal;
  };

  // Función para calcular la nota final del curso para un estudiante
  const calcularNotaFinal = (estudiante: Estudiante) => {
    let notaFinal = 0;
    let porcentajeTotal = 0;

    componentes.forEach(componente => {
      const nota = calificaciones.porComponente[estudiante.id]?.[componente.id] || 0;
      notaFinal += nota * (componente.porcentaje / 100);
      porcentajeTotal += componente.porcentaje;
    });

    // Si no hay componentes o el porcentaje total es 0, retornar 0
    if (componentes.length === 0 || porcentajeTotal === 0) return 0;

    return notaFinal;
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
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] min-w-[100px]"></TableHead>
              <TableHead className="w-[180px] min-w-[180px]"></TableHead>
              <TableHead className="w-[120px] min-w-[120px]"></TableHead>
              {periodos.map((periodo, index) => {
                const componentesCount = componentes.filter(c => c.periodo_id === periodo.id).length;
                const periodoWidth = `${componentesCount * 100 + 50}px`;
                return (
                  <TableHead 
                    key={periodo.id} 
                    className={`text-center ${index % 2 === 0 ? 'bg-muted/50' : ''}`} 
                    colSpan={componentesCount + 1}
                    style={{ width: periodoWidth, minWidth: periodoWidth }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>{periodo.nombre}</span>
                      <span className="text-xs text-muted-foreground">({periodo.porcentaje}%)</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onExportPeriod?.(periodo.id)}
                        title="Exportar periodo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="text-center w-[60px] min-w-[60px]">
                <span>Nota Final</span>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="w-[120px] min-w-[120px]">Apellidos</TableHead>
              <TableHead className="w-[120px] min-w-[120px]">Nombres</TableHead>
              <TableHead className="w-[100px] min-w-[100px]">Identificación</TableHead>
              {periodos.map(periodo => (
                <React.Fragment key={periodo.id}>
                  {componentes
                    .filter(c => c.periodo_id === periodo.id)
                    .map(componente => (
                      <TableHead key={componente.id} className="text-center p-0 border-x w-[100px] min-w-[100px]">
                        <div className="flex flex-col items-center">
                          <div className="p-2">
                            <span className="text-sm">{componente.nombre}</span>
                            <span className="block text-xs text-muted-foreground">
                              ({componente.porcentaje}%)
                            </span>
                          </div>
                          <div className="flex justify-center gap-1 p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onImportGrades?.(componente.id)}
                              title="Importar calificaciones"
                              className="h-6 w-6"
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onExportGrades?.(componente.id)}
                              title="Exportar calificaciones"
                              className="h-6 w-6"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onToggleLock(componente.id)}
                              title={componentesBloqueados[componente.id] ? "Desbloquear calificaciones" : "Bloquear calificaciones"}
                              className="h-6 w-6"
                            >
                              {componentesBloqueados[componente.id] ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  <TableHead className="text-center border-x w-[50px] min-w-[50px]">
                    <div className="flex flex-col items-center p-2">
                      <span className="text-sm">Nota del Periodo</span>
                    </div>
                  </TableHead>
                </React.Fragment>
              ))}
              <TableHead className="text-center border-x w-[60px] min-w-[60px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm">Nota Final</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onExportFinal}
                    title="Exportar notas finales"
                    className="h-6 w-6"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estudiantes.map(estudiante => (
              <TableRow key={estudiante.id}>
                <TableCell className="font-medium w-[120px] min-w-[120px]">
                  {estudiante.apellidos}
                </TableCell>
                <TableCell className="w-[120px] min-w-[120px]">
                  {estudiante.nombres}
                </TableCell>
                <TableCell className="w-[100px] min-w-[100px]">
                  {estudiante.identificacion}
                </TableCell>
                {periodos.map(periodo => (
                  <React.Fragment key={periodo.id}>
                    {componentes
                      .filter(c => c.periodo_id === periodo.id)
                      .map(componente => (
                        <TableCell key={componente.id} className="text-center border-x w-[100px] min-w-[100px] p-0">
                          <div className="flex items-center justify-center h-full">
                            <GradeInput
                              value={calificaciones.porComponente[estudiante.id]?.[componente.id] || null}
                              onChange={(value) => onGradeChange(estudiante.id, componente.id, value)}
                              disabled={componentesBloqueados[componente.id]}
                            />
                          </div>
                        </TableCell>
                      ))}
                    <TableCell className="text-center font-medium bg-muted/50 border-x w-[50px] min-w-[50px]">
                      {calcularNotaPeriodo(estudiante, periodo).toFixed(2)}
                    </TableCell>
                  </React.Fragment>
                ))}
                <TableCell className="text-center font-medium bg-muted border-x w-[60px] min-w-[60px]">
                  {calcularNotaFinal(estudiante).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 