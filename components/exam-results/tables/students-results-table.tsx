'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { monoFont } from '@/lib/fonts';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Estudiante, ResultadoExamen } from '../utils/types';
import { getStudentDisplayName } from '@/lib/utils/student-name';

interface StudentsResultsTableProps {
  todosEstudiantes: Estudiante[];
  resultados: ResultadoExamen[];
  verSoloConExamen: boolean;
  onShowDetails: (_resultado: ResultadoExamen) => void;
  onShowManualGrade: (_estudiante: Estudiante) => void;
}

export function StudentsResultsTable({
  todosEstudiantes,
  resultados,
  verSoloConExamen,
  onShowDetails,
  onShowManualGrade
}: StudentsResultsTableProps) {
  const t = useTranslations('dashboard.exams.results');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Crear Map de resultados para búsqueda O(1) (memoizado)
  const resultadosMap = useMemo(() => {
    const map = new Map<string, ResultadoExamen>();
    resultados.forEach(resultado => {
      map.set(resultado.estudiante.id, resultado);
    });
    return map;
  }, [resultados]);

  // Filtrar estudiantes (memoizado)
  const filteredStudents = useMemo(() => {
    return todosEstudiantes
      .filter(estudiante => {
        if (!verSoloConExamen) return true;
        return resultadosMap.has(estudiante.id);
      })
      .filter(estudiante => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          (estudiante.nombres && estudiante.nombres.toLowerCase().includes(searchLower)) ||
          estudiante.apellidos.toLowerCase().includes(searchLower)
        );
      });
  }, [todosEstudiantes, resultadosMap, verSoloConExamen, searchQuery]);

  // Calcular paginación (memoizado)
  const { totalPages, startIndex, endIndex, paginatedStudents } = useMemo(() => {
    const total = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const paginated = filteredStudents.slice(start, end);
    
    return {
      totalPages: total,
      startIndex: start,
      endIndex: end,
      paginatedStudents: paginated
    };
  }, [filteredStudents, currentPage]);

  // Componente StudentCard para vista mobile (memoizado con useCallback)
  const StudentCard = useCallback(({ estudiante, index }: { estudiante: Estudiante; index: number }) => {
    const resultado = resultadosMap.get(estudiante.id);
    const isEven = index % 2 === 0;

    return (
      <div
        className={`p-2 rounded-lg space-y-1.5 ${
          isEven ? 'bg-muted/30' : 'bg-background'
        } border`}
      >
        <div className="space-y-1">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.name')}
            </div>
            <div className={`text-sm font-medium ${monoFont}`}>
              {getStudentDisplayName(estudiante, 'lastFirst')}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.identification')}
            </div>
            <div className={`text-sm ${monoFont}`}>
              {estudiante.identificacion}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-0.5">
                {t('table.score')}
              </div>
              <div className={`text-sm font-medium ${monoFont}`}>
                {resultado ? resultado.puntaje_obtenido.toFixed(2) : '-'}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-0.5">
                {t('table.percentage')}
              </div>
              <div className={`text-sm font-medium ${monoFont}`}>
                {resultado ? resultado.porcentaje.toFixed(1) + '%' : '-'}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.status')}
            </div>
            <div>
              {resultado ? (
                <span className="px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground font-medium shadow-sm inline-block">
                  {t('status.graded')}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground font-medium shadow-sm inline-block">
                  {t('status.notPresented')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-1">
          {resultado ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => onShowDetails(resultado)}
              className="w-full underline"
            >
              {t('viewDetailsButton')}
            </Button>
          ) : (
            <Button
              variant="link"
              size="sm"
              onClick={() => onShowManualGrade(estudiante)}
              className="w-full underline"
            >
              {t('dialogs.enterGrade')}
            </Button>
          )}
        </div>
      </div>
    );
  }, [resultadosMap, t, onShowDetails, onShowManualGrade]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('studentsSection')}</CardTitle>
        <CardDescription>
          {t('studentsSectionDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {todosEstudiantes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('emptyState.noResultsMessage')}
          </div>
        ) : (
          <>
            {/* Barra de búsqueda */}
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder') || 'Buscar por nombre o apellidos...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('emptyState.noSearchResults') || 'No se encontraron estudiantes con ese criterio'}
              </div>
            ) : (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="py-3 px-4 text-left font-semibold">{t('table.name')}</th>
                        <th className="py-3 px-4 text-left font-semibold">{t('table.identification')}</th>
                        <th className="py-3 px-4 text-center font-semibold">{t('table.score')}</th>
                        <th className="py-3 px-4 text-center font-semibold">{t('table.percentage')}</th>
                        <th className="py-3 px-4 text-center font-semibold">{t('table.status')}</th>
                        <th className="py-3 px-4 text-center font-semibold">{t('table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((estudiante, index) => {
                        const resultado = resultadosMap.get(estudiante.id);
                        const globalIndex = startIndex + index;
                        const isEven = globalIndex % 2 === 0;

                        return (
                          <tr
                            key={estudiante.id}
                            className={`border-b hover:bg-muted/70 transition-colors ${
                              isEven ? 'bg-muted/30' : 'bg-background'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className={`${monoFont}`}>
                                {getStudentDisplayName(estudiante, 'lastFirst')}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`${monoFont}`}>{estudiante.identificacion}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className={`${monoFont} font-medium`}>
                                {resultado ? resultado.puntaje_obtenido.toFixed(2) : '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className={`${monoFont} font-medium`}>
                                {resultado ? resultado.porcentaje.toFixed(1) + '%' : '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {resultado ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground font-medium shadow-sm">
                                  {t('status.graded')}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground font-medium shadow-sm">
                                  {t('status.notPresented')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {resultado ? (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="underline"
                                  onClick={() => onShowDetails(resultado)}
                                >
                                  {t('viewDetailsButton')}
                                </Button>
                              ) : (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="underline"
                                  onClick={() => onShowManualGrade(estudiante)}
                                >
                                  {t('dialogs.enterGrade')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista Mobile - Cards */}
                <div className="lg:hidden space-y-1.5">
                  {paginatedStudents.map((estudiante, index) => (
                    <StudentCard
                      key={estudiante.id}
                      estudiante={estudiante}
                      index={startIndex + index}
                    />
                  ))}
                </div>

                {/* Controles de paginación */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                  {/* Info de resultados */}
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    {filteredStudents.length > 0 ? (
                      <>
                        <span className="hidden sm:inline">{t('pagination.showing') || 'Mostrando'} </span>
                        <span className="font-medium text-foreground">
                          {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)}
                        </span>{' '}
                        {t('pagination.of') || 'de'}{' '}
                        <span className="font-medium text-foreground">
                          {filteredStudents.length}
                        </span>{' '}
                        <span className="hidden sm:inline">{t('pagination.students') || 'estudiantes'}</span>
                      </>
                    ) : (
                      <span>{t('pagination.noResults') || 'Sin resultados'}</span>
                    )}
                  </div>

                  {/* Controles de navegación */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">{t('pagination.previous') || 'Anterior'}</span>
                    </Button>
                    <div className="text-xs sm:text-sm font-medium px-2 whitespace-nowrap">
                      <span className="hidden sm:inline">{t('pagination.page') || 'Página'} </span>
                      {currentPage} {t('pagination.of') || 'de'} {totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage >= totalPages}
                      className="h-8"
                    >
                      <span className="hidden sm:inline mr-1">{t('pagination.next') || 'Siguiente'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
