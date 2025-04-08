"use client";

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { PDFGenerator } from '@/components/exam/pdf-generator';
import Link from 'next/link';
import { toast } from 'sonner';
import { Camera, Trash2 } from 'lucide-react';
import { Grupo as BaseGrupo, Student } from '@/lib/types/database';
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  titulo: string;
  descripcion?: string;
  duracion_minutos: number;
  estado: 'borrador' | 'publicado' | 'cerrado';
  preguntas: Array<{
    id: string;
    texto: string;
    opciones_respuesta: Array<{
      id: string;
      texto: string;
    }>;
    puntaje: number;
  }>;
  materia_id: string;
}

interface ExamGroup extends BaseGrupo {
  materia: {
    nombre: string;
  };
  estudiantes: Student[];
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [group, setGroup] = useState<ExamGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No autorizado');
        }

        // Fetch exam data
        const examResponse = await fetch(`/api/exams/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (!examResponse.ok) {
          throw new Error('Error al cargar el examen');
        }
        const examData = await examResponse.json();
        setExam(examData);

        // Fetch group data using materia_id
        const groupResponse = await fetch(`/api/groups/by-materia/${examData.materia_id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (!groupResponse.ok) {
          throw new Error('Error al cargar el grupo');
        }
        const groupData = await groupResponse.json();
        setGroup(groupData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error('Error al cargar los datos del examen');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autorizado');
      }

      const response = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el examen');
      }

      toast.success('Examen eliminado correctamente');
      
      // Usar replace en lugar de push para evitar que el usuario pueda volver atrás
      router.replace('/dashboard/exams');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el examen');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !exam || !group) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error || 'No se pudo cargar el examen'}</p>
        </div>
      </div>
    );
  }

  // Transformar los datos al formato esperado por PDFGenerator
  const pdfGroup = {
    ...group,
    estudiantes: group.estudiantes
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{exam.titulo}</h1>
          <span className={`px-2 py-1 text-sm rounded-full ${
            exam.estado === 'borrador' 
              ? 'bg-yellow-100 text-yellow-800' 
              : exam.estado === 'publicado'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {exam.estado.charAt(0).toUpperCase() + exam.estado.slice(1)}
          </span>
        </div>
        <div className="flex gap-4">
          {exam.estado === 'borrador' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el examen y todos sus elementos relacionados.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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