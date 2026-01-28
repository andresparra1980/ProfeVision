"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";

import { hasNombresSeparados } from "@/lib/utils/student-name";

interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  created_at: string;
}

interface StudentsTableProps {
  students: Student[];
  searchQuery: string;
  onViewDetails: (_studentId: string) => void;
  loadingDetails: boolean;
  selectedStudentId: string | null;
}

export function StudentsTable({
  students,
  searchQuery,
  onViewDetails,
  loadingDetails,
  selectedStudentId
}: StudentsTableProps) {
  const t = useTranslations('dashboard.students');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Detectar si los estudiantes tienen nombres separados
  const nombresSeparados = useMemo(() => hasNombresSeparados(students), [students]);

  // Filter students based on search query (memoizado)
  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      student.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.nombres && student.nombres.toLowerCase().includes(searchQuery.toLowerCase())) ||
      student.identificacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [students, searchQuery]);

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

  // Reset a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Componente StudentCard para vista mobile (memoizado)
  const StudentCard = useCallback(({ student, index }: { student: Student; index: number }) => {
    const isEven = index % 2 === 0;

    return (
      <div
        className={`p-2 rounded-lg space-y-1.5 ${isEven ? 'bg-muted/30' : 'bg-background'
          } border`}
      >
        <div className="space-y-1">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.headers.surnames')}
            </div>
            <div className={`text-sm font-medium font-mono`}>
              {student.apellidos}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.headers.names')}
            </div>
            <div className={`text-sm font-mono`}>
              {student.nombres}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.headers.identification')}
            </div>
            <div className={`text-sm font-mono`}>
              {student.identificacion}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              {t('table.headers.email')}
            </div>
            <div className={`text-sm font-mono`}>
              {student.email || '-'}
            </div>
          </div>
        </div>

        <div className="pt-1">
          <Button
            variant="link"
            size="sm"
            onClick={() => onViewDetails(student.id)}
            disabled={loadingDetails}
            className="w-full underline"
          >
            {loadingDetails && selectedStudentId === student.id ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('table.actions.viewDetails')}
          </Button>
        </div>
      </div>
    );
  }, [t, onViewDetails, loadingDetails, selectedStudentId]);

  return (
    <div className="space-y-4">
      {/* Info de total de estudiantes */}
      <div className="text-sm text-muted-foreground">
        <Users className="inline-block mr-1 h-4 w-4" />
        {filteredStudents.length} {t('table.studentsFound')}
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('table.noStudents') || 'No se encontraron estudiantes'}
        </div>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {nombresSeparados ? (
                    <>
                      <TableHead>{t('table.headers.surnames')}</TableHead>
                      <TableHead>{t('table.headers.names')}</TableHead>
                    </>
                  ) : (
                    <TableHead>{t('table.headers.fullName')}</TableHead>
                  )}
                  <TableHead>{t('table.headers.identification')}</TableHead>
                  <TableHead>{t('table.headers.email')}</TableHead>
                  <TableHead>{t('table.headers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student: Student, index) => {
                  const globalIndex = startIndex + index;
                  const isEven = globalIndex % 2 === 0;

                  return (
                    <TableRow
                      key={student.id}
                      className={`hover:bg-muted/70 transition-colors ${isEven ? 'bg-muted/30' : 'bg-background'
                        }`}
                    >
                      {nombresSeparados ? (
                        <>
                          <TableCell className={`font-medium font-mono`}>{student.apellidos}</TableCell>
                          <TableCell className="font-mono">{student.nombres || ''}</TableCell>
                        </>
                      ) : (
                        <TableCell className={`font-medium font-mono`}>{student.apellidos}</TableCell>
                      )}
                      <TableCell className="font-mono">{student.identificacion}</TableCell>
                      <TableCell className="font-mono">{student.email || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onViewDetails(student.id)}
                          disabled={loadingDetails}
                          className="underline"
                        >
                          {loadingDetails && selectedStudentId === student.id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t('table.actions.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden space-y-1.5">
            {paginatedStudents.map((student, index) => (
              <StudentCard
                key={student.id}
                student={student}
                index={startIndex + index}
              />
            ))}
          </div>
        </>
      )}

      {/* Controles de paginación */}
      {filteredStudents.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
          {/* Info de resultados */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            <span className="hidden sm:inline">{t('pagination.showing') || 'Mostrando'} </span>
            <span className="font-medium text-foreground">
              {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)}
            </span>{' '}
            {t('pagination.of') || 'de'}{' '}
            <span className="font-medium text-foreground">
              {filteredStudents.length}
            </span>{' '}
            <span className="hidden sm:inline">{t('pagination.students') || 'estudiantes'}</span>
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
              {currentPage} {t('pagination.of') || 'de'} {totalPages}
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
      )}
    </div>
  );
}
