import React from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
import { Lock, Unlock, Download, Upload, LinkIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import logger from '@/lib/utils/logger';
import { hasNombresSeparados } from '@/lib/utils/student-name';

interface Calificaciones {
  porComponente: Record<string, Record<string, number>>;
}

interface GradesTableProps {
  estudiantes: Estudiante[];
  periodos: Periodo[];
  componentes: ComponenteCalificacion[];
  calificaciones: Calificaciones;
  onGradeChange: (_estudianteId: string, _componenteId: string, _value: number | null) => void;
  isLoading?: boolean;
  componentesBloqueados: Record<string, boolean>;
  onToggleLock: (_componenteId: string) => void;
  onImportGrades?: (_componenteId: string) => void;
  onExportGrades?: (_componenteId: string) => void;
  onExportPeriod?: (_periodoId: string) => void;
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
  const t = useTranslations('dashboard.components.gradesTable');
  
  // Detectar si los estudiantes tienen nombres separados
  const nombresSeparados = useMemo(() => hasNombresSeparados(estudiantes), [estudiantes]);
  
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
        toast.error(t('error.noAuthToken'));
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
        throw new Error(error.error || t('error.syncGrades'));
      }
      
      const result = await response.json();
      logger.log('Resultado de sincronización:', result);
      
      toast.success(t('success.syncComplete'));
      
      // Recargar la página para mostrar las calificaciones actualizadas
      window.location.reload();
    } catch (error) {
      logger.error('Error:', error);
      toast.error(t('error.syncGrades'));
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

  // Calcular el ancho total necesario para los datos de estudiante
  const studentDataWidth = 340; // 120px + 120px + 100px

  return (
    <div className="space-y-4">
      <div className="rounded-md border w-full bg-card dark:bg-card shadow-sm relative">
        <div className="overflow-x-auto" style={{ position: 'relative' }}>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead 
                  className="text-center border-x-2 border-border md:sticky left-0 z-20 bg-card dark:bg-card"
                  colSpan={3}
                  style={{ width: `${studentDataWidth}px`, minWidth: `${studentDataWidth}px` }}
                >
                  <div className="flex items-center justify-center py-2">
                    <span className="font-semibold text-foreground dark:text-foreground">{t('studentData')}</span>
                  </div>
                </TableHead>
                {periodos.map((periodo, _index) => {
                  const componentesCount = componentes.filter(c => c.periodo_id === periodo.id).length;
                  const periodoWidth = `${componentesCount * 100 + 160}px`;
                  return (
                    <TableHead 
                      key={periodo.id} 
                      className={`text-center border-x-2 border-border`} 
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
                          title={t('exportPeriod')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableHead>
                  );
                })}
                <TableHead className="text-center w-[60px] min-w-[60px] border-x-2 border-border">
                  <div className="flex flex-col items-center gap-1 py-2">
                    <span className="font-semibold text-foreground dark:text-foreground">{t('finalGrade')}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onExportFinal}
                      title={t('exportFinalGrades')}
                      className="h-6 w-6"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
              <TableRow className="border-b-2 border-border">
                {nombresSeparados ? (
                  <>
                    <TableHead className="w-[120px] min-w-[120px] md:sticky left-0 z-20 bg-card dark:bg-card">{t('surnames')}</TableHead>
                    <TableHead className="w-[120px] min-w-[120px] md:sticky left-[120px] z-20 bg-card dark:bg-card">{t('names')}</TableHead>
                    <TableHead className="w-[100px] min-w-[100px] md:sticky left-[240px] z-20 bg-card dark:bg-card">{t('identification')}</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="w-[140px] min-w-[140px] md:sticky left-0 z-20 bg-card dark:bg-card">{t('fullName')}</TableHead>
                    <TableHead className="w-[100px] min-w-[100px] md:sticky left-[140px] z-20 bg-card dark:bg-card">{t('identification')}</TableHead>
                  </>
                )}
                {periodos.map(periodo => (
                  <React.Fragment key={periodo.id}>
                    {componentes
                      .filter(c => c.periodo_id === periodo.id)
                      .map(componente => (
                        <TableHead key={componente.id} className={`text-center p-0 border-x w-[100px] min-w-[100px]`}>
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
                                        <span className="text-xs">{t('exam')}</span>
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t('linkedToExam')}: {componentesVinculados[componente.id].titulo}</p>
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
                                  title={t('lockGrades')}
                                >
                                  <Unlock className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onToggleLock(componente.id)}
                                  title={t('unlockGrades')}
                                  disabled={!!componentesVinculados[componente.id]}
                                >
                                  <Lock className="h-3 w-3" />
                                </Button>
                              )}
    
                              {componentesVinculados[componente.id] ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleSyncExamGrades(componente.id)}
                                  title={t('syncFromExam')}
                                >
                                  <RefreshCw className="h-3 w-3 text-secondary" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onImportGrades?.(componente.id)}
                                  title={t('importGrades')}
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
                                title={t('exportGrades')}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    <TableHead className="text-center border-x w-[80px] min-w-[80px]">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{t('grade')}</span>
                        <span className="font-medium">{t('period')}</span>
                        <span className="text-xs text-foreground/70 dark:text-foreground/70">({t('weighted')})</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center border-x w-[80px] min-w-[80px]">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{t('grade')}</span>
                        <span className="font-medium">{t('period')}</span>
                        <span className="text-xs text-foreground/70 dark:text-foreground/70">({t('absolute')})</span>
                      </div>
                    </TableHead>
                  </React.Fragment>
                ))}
                <TableHead className="text-center w-[60px] min-w-[60px] border-x">
                  <span className="font-medium">{t('finalGrade')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantes.map(estudiante => (
                <TableRow key={estudiante.id}>
                  {nombresSeparados ? (
                    <>
                      <TableCell className="font-medium w-[120px] min-w-[120px] md:sticky left-0 z-10 bg-white dark:bg-black">
                        {estudiante.apellidos}
                      </TableCell>
                      <TableCell className="w-[120px] min-w-[120px] md:sticky left-[120px] z-10 bg-white dark:bg-black">
                        {estudiante.nombres || ''}
                      </TableCell>
                      <TableCell className="w-[100px] min-w-[100px] md:sticky left-[240px] z-10 bg-white dark:bg-black">
                        {estudiante.identificacion}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium w-[140px] min-w-[140px] md:sticky left-0 z-10 bg-white dark:bg-black">
                        {estudiante.apellidos}
                      </TableCell>
                      <TableCell className="w-[100px] min-w-[100px] md:sticky left-[140px] z-10 bg-white dark:bg-black">
                        {estudiante.identificacion}
                      </TableCell>
                    </>
                  )}
                  {periodos.map(periodo => (
                    <React.Fragment key={periodo.id}>
                      {componentes
                        .filter(c => c.periodo_id === periodo.id)
                        .map(componente => (
                          <TableCell key={componente.id} className={`
                            text-center border-x w-[100px] min-w-[100px] p-0
                            ${componentesVinculados[componente.id] ? 'bg-secondary/10 dark:bg-secondary/10' : ''}
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
                                <span className="font-semibold px-2 py-1">
                                  {calcularNotaPeriodo(estudiante, periodo).ponderada.toFixed(1)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('absoluteGrade')}: {calcularNotaPeriodo(estudiante, periodo).absoluta.toFixed(1)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableCell className="text-center font-semibold p-1 border-x">
                        <div className="px-2 py-1">
                          {calcularNotaFinal(estudiante).toFixed(1)}
                        </div>
                      </TableCell>
                    </React.Fragment>
                  ))}
                  <TableCell className="text-center font-semibold p-1 border-x">
                    <div className="px-2 py-1">
                      {calcularNotaFinal(estudiante).toFixed(1)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 