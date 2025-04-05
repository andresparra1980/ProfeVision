"use client";

import { use } from 'react';
import { Button } from '@/components/ui/button';
import { PDFGenerator } from '@/components/exam/pdf-generator';
import Link from 'next/link';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { Grupo as BaseGrupo, Student } from '@/lib/types/database';

interface Exam {
  id: string;
  titulo: string;
  descripcion?: string;
  duracion_minutos: number;
  preguntas: Array<{
    id: string;
    texto: string;
    opciones_respuesta: Array<{
      id: string;
      texto: string;
    }>;
    puntaje: number;
  }>;
  grupo_id: string;
}

interface ExamGroup extends BaseGrupo {
  materia: {
    nombre: string;
  };
  estudiantes: Student[];
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const exam = use(fetch(`/api/exams/${id}`).then(res => res.json())) as Exam;
  const group = use(fetch(`/api/groups/${exam.grupo_id}`).then(res => res.json())) as ExamGroup;

  // Transformar los datos al formato esperado por PDFGenerator
  const pdfGroup = {
    ...group,
    estudiantes: group.estudiantes
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{exam.titulo}</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href={`/dashboard/exams/${id}/scan`} className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Escanear Respuestas
            </Link>
          </Button>
          <PDFGenerator 
            exam={exam} 
            group={pdfGroup} 
            paperSize="LETTER"
            fileName={`${exam.titulo.toLowerCase().replace(/\s+/g, '_')}.pdf`}
          />
        </div>
      </div>
      
      {/* Resto del contenido de la página */}
    </div>
  );
} 