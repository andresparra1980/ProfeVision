"use client";

import { useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";

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
  onViewDetails: (studentId: string) => void;
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

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.identificacion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <Users className="inline-block mr-1 h-4 w-4" />
          {filteredStudents.length} {t('table.studentsFound')}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.headers.surnames')}</TableHead>
            <TableHead>{t('table.headers.names')}</TableHead>
            <TableHead>{t('table.headers.identification')}</TableHead>
            <TableHead>{t('table.headers.email')}</TableHead>
            <TableHead>{t('table.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student: Student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.apellidos}</TableCell>
              <TableCell>{student.nombres}</TableCell>
              <TableCell>{student.identificacion}</TableCell>
              <TableCell>{student.email || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(student.id)}
                  disabled={loadingDetails}
                >
                  {loadingDetails && selectedStudentId === student.id ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('table.actions.viewDetails')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
