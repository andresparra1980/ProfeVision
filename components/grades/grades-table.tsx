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
import { Lock, Unlock, FileUp, Download, Upload, ArrowUpDown, ArrowDownUp, FileText, LinkIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

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
  componentesVinculados?: Record<string, { examen_id: string, titulo: string }>;
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
  componentesVinculados = {},
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
    if (componentesPeriodo.length === 0 || porcentajeTotal === 0) return { ponderada: 0, absoluta: 0 };

    const notaPonderada = notaFinal;
    const notaAbsoluta = notaFinal / (periodo.porcentaje / 100);

    return { ponderada: notaPonderada, absoluta: notaAbsoluta };
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

  // Función para sincronizar las calificaciones desde los exámenes vinculados
  const handleSyncExamGrades = async (componenteId: string) => {
    if (!componentesVinculados[componenteId]) return;
    
    const examenId = componentesVinculados[componenteId].examen_id;
    try {
      // Obtener token de sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        toast.error('No se encontró token de autenticación');
        return;
      }
      
      const response = await fetch('/api/exams/sync-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ examId: examenId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al sincronizar calificaciones');
      }
      
      const result = await response.json();
      console.log('Resultado de sincronización:', result);
      
      toast.success('Calificaciones sincronizadas correctamente');
      
      // Recargar la página para mostrar las calificaciones actualizadas
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al sincronizar calificaciones');
    }
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
      <div className="rounded-md border overflow-x-auto w-full bg-card dark:bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border">
              <TableHead className="w-[100px] min-w-[100px]"></TableHead>
              <TableHead className="w-[180px] min-w-[180px]"></TableHead>
              <TableHead className="w-[120px] min-w-[120px]"></TableHead>
              {periodos.map((periodo, index) => {
                const componentesCount = componentes.filter(c => c.periodo_id === periodo.id).length;
                const periodoWidth = `${componentesCount * 100 + 160}px`;
                return (
                  <TableHead 
                    key={periodo.id} 
                    className={`text-center border-x-2 border-border ${index % 2 === 0 ? 'bg-muted dark:bg-muted/50' : 'bg-muted/80 dark:bg-muted/40'}`} 
                    colSpan={componentesCount + 2}
                    style={{ width: periodoWidth, minWidth: periodoWidth }}
                  >
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground dark:text-foreground">{periodo.nombre}</span>
                        <span className="text-xs text-foreground/80 dark:text-foreground/80">({periodo.porcentaje}%)</span>
                      </div>
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
              <TableHead className="text-center w-[60px] min-w-[60px] bg-muted dark:bg-muted/50 border-x-2 border-border">
                <div className="flex flex-col items-center gap-1 py-2">
                  <span className="font-semibold text-foreground dark:text-foreground">Nota Final</span>
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
            <TableRow className="border-b-2 border-border">
              <TableHead className="w-[120px] min-w-[120px]">Apellidos</TableHead>
              <TableHead className="w-[120px] min-w-[120px]">Nombres</TableHead>
              <TableHead className="w-[100px] min-w-[100px]">Identificación</TableHead>
              {periodos.map(periodo => (
                <React.Fragment key={periodo.id}>
                  {componentes
                    .filter(c => c.periodo_id === periodo.id)
                    .map(componente => (
                      <TableHead key={componente.id} className={`text-center p-0 border-x w-[100px] min-w-[100px] ${componente.periodo_id && periodos.findIndex(p => p.id === componente.periodo_id) % 2 === 0 ? 'bg-muted/50 dark:bg-muted/20' : 'bg-muted/30 dark:bg-muted/10'}`}>
                        <div className="flex flex-col items-center">
                          <div className="p-2">
                            <span className="text-sm">{componente.nombre}</span>
                            <span className="block text-xs text-muted-foreground">
                              ({componente.porcentaje}%)
                            </span>
                            {componentesVinculados[componente.id] && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="mt-1 gap-1 px-1 py-0 h-5 bg-secondary text-primary-foreground border-secondary hover:bg-secondary/90">
                                      <LinkIcon className="h-3 w-3" />
                                      <span className="text-xs">Examen</span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Vinculado al examen: {componentesVinculados[componente.id].titulo}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex gap-1 p-1 border-t">
                            {!componentesBloqueados[componente.id] && !componentesVinculados[componente.id] ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onToggleLock(componente.id)}
                                title="Bloquear calificaciones"
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onToggleLock(componente.id)}
                                title={componentesVinculados[componente.id] ? 
                                  "Componente vinculado a examen (no se puede desbloquear)" : 
                                  "Desbloquear calificaciones"
                                }
                                disabled={!!componentesVinculados[componente.id]}
                              >
                                <Lock className={`h-3 w-3 ${componentesVinculados[componente.id] ? "text-secondary" : ""}`} />
                              </Button>
                            )}
                            {componentesVinculados[componente.id] ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleSyncExamGrades(componente.id)}
                                title="Sincronizar calificaciones desde el examen"
                              >
                                <RefreshCw className="h-3 w-3 text-secondary" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onImportGrades?.(componente.id)}
                                title="Importar calificaciones"
                                disabled={!!componentesVinculados[componente.id]}
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onExportGrades?.(componente.id)}
                              title="Exportar calificaciones"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  <TableHead className="text-center bg-muted/60 dark:bg-muted/30 border-x w-[80px] min-w-[80px]">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Nota</span>
                      <span className="font-medium">Periodo</span>
                      <span className="text-xs text-foreground/70 dark:text-foreground/70">(Pond.)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-muted/60 dark:bg-muted/30 border-x w-[80px] min-w-[80px]">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Nota</span>
                      <span className="font-medium">Periodo</span>
                      <span className="text-xs text-foreground/70 dark:text-foreground/70">(Abs.)</span>
                    </div>
                  </TableHead>
                </React.Fragment>
              ))}
              <TableHead className="text-center w-[60px] min-w-[60px] bg-muted/60 dark:bg-muted/30 border-x">
                <span className="font-medium">Nota Final</span>
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
                        <TableCell key={componente.id} className={`
                          text-center border-x w-[100px] min-w-[100px] p-0
                          ${componentesVinculados[componente.id] ? 'bg-secondary/10 dark:bg-secondary/10' : 
                            componente.periodo_id && periodos.findIndex(p => p.id === componente.periodo_id) % 2 === 0 ? 'bg-muted/20 dark:bg-muted/5' : ''}
                        `}>
                          <div className="flex items-center justify-center h-full">
                            <GradeInput
                              value={calificaciones.porComponente[estudiante.id]?.[componente.id] || null}
                              onChange={(value) => onGradeChange(estudiante.id, componente.id, value)}
                              disabled={componentesBloqueados[componente.id] || !!componentesVinculados[componente.id]}
                            />
                          </div>
                        </TableCell>
                      ))}
                    <TableHead key={`periodo-nota-${periodo.id}`} className="text-center p-1 border-x">
                      <div className="flex justify-center items-center h-full">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-semibold bg-muted/30 dark:bg-muted/50 px-2 py-1 rounded border border-border">
                                {calcularNotaPeriodo(estudiante, periodo).ponderada.toFixed(1)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Nota absoluta: {calcularNotaPeriodo(estudiante, periodo).absoluta.toFixed(1)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableCell className="text-center font-semibold p-1 border-x bg-muted/50 dark:bg-muted/20">
                      <div className="bg-card dark:bg-card px-2 py-1 rounded border border-border">
                        {calcularNotaFinal(estudiante).toFixed(1)}
                      </div>
                    </TableCell>
                  </React.Fragment>
                ))}
                <TableCell className="text-center font-semibold p-1 border-x bg-muted/70 dark:bg-muted/40">
                  <div className="bg-card dark:bg-card px-2 py-1 rounded border border-border">
                    {calcularNotaFinal(estudiante).toFixed(1)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 