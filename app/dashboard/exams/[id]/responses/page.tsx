"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Student } from '@/lib/types/database';

// Configurar flag de debug para mensajes de consola
const DEBUG = process.env.NODE_ENV === 'development';

// Importar el componente PDF completo de forma dinámica
const PDFGenerator = dynamic(
  () => import('@/components/exam/pdf-generator').then(mod => mod.PDFGenerator),
  {
    ssr: false,
    loading: () => (
      <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        Cargando...
      </div>
    )
  }
);

interface GroupWithEstudiantes {
  grupos: {
    id: string;
    nombre: string;
    materias: {
      nombre: string;
    };
    estudiantes: Array<{
      estudiante: Student;
    }>;
  };
}

interface Group {
  id: string;
  nombre: string;
  materia: {
    nombre: string;
  };
  estudiantes: Student[];
}

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
      orden?: number;
    }>;
    puntaje: number;
    orden?: number;
  }>;
}

// Componente para generar todas las hojas de respuesta
const AllAnswerSheets = ({ exam, group, paperSize }: { exam: Exam; group: Group; paperSize: 'LETTER' | 'A4' }) => {
  if (!exam || !group) return null;
  
  return (
    <PDFGenerator
      exam={exam}
      group={group}
      paperSize={paperSize}
      fileName={`hojas-respuesta-${exam.titulo}-${group.nombre}.pdf`}
    />
  );
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResponseSheetsPage({ params }: PageProps) {
  const { id } = use(params);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [paperSize, setPaperSize] = useState<'LETTER' | 'A4'>('LETTER');
  const [exam, setExam] = useState<Exam | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar datos del examen y grupos asignados
  const loadExamAndGroups = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener detalles del examen
      const { data: examData, error: examError } = await supabase
        .from('examenes')
        .select(`
          id,
          titulo,
          descripcion,
          duracion_minutos,
          preguntas (
            id,
            texto,
            puntaje,
            orden,
            opciones_respuesta (
              id,
              texto,
              orden
            )
          )
        `)
        .eq('id', id)
        .single();

      if (examError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
        throw examError;
      }

      // Ordenar las preguntas por el campo 'orden'
      if (examData && examData.preguntas) {
        examData.preguntas.sort((a: {orden?: number}, b: {orden?: number}) => (a.orden || 0) - (b.orden || 0));
        
        // Ordenar las opciones de respuesta por el campo 'orden'
        examData.preguntas.forEach((pregunta: {opciones_respuesta?: Array<{orden?: number}>}) => {
          if (pregunta.opciones_respuesta) {
            pregunta.opciones_respuesta.sort((a: {orden?: number}, b: {orden?: number}) => (a.orden || 0) - (b.orden || 0));
          }
        });
      }

      // Obtener grupos asignados con sus estudiantes usando joins explícitos
      const { data: groupsData, error: groupsError } = await supabase
        .from('examen_grupo')
        .select(`
          grupos!inner (
            id,
            nombre,
            materias!inner (
              nombre
            ),
            estudiantes:estudiante_grupo!inner (
              estudiante:estudiantes!inner (
                id,
                nombres,
                apellidos,
                identificacion
              )
            )
          )
        `)
        .eq('examen_id', id);

      if (groupsError) {
        if (DEBUG) {
          // Registramos el error en un logger en lugar de la consola
        }
        throw groupsError;
      }

      // Transformar los datos para que coincidan con las interfaces
      const transformedGroups: Group[] = groupsData.map((item: GroupWithEstudiantes) => ({
        id: item.grupos.id,
        nombre: item.grupos.nombre,
        materia: {
          nombre: item.grupos.materias.nombre,
        },
        estudiantes: item.grupos.estudiantes.map((e) => ({
          id: e.estudiante.id,
          nombres: e.estudiante.nombres,
          apellidos: e.estudiante.apellidos,
          identificacion: e.estudiante.identificacion,
        })),
      }));

      setExam(examData);
      setGroups(transformedGroups);
    } catch (error: unknown) {
      if (DEBUG) {
        // Registramos el error en un logger en lugar de la consola
      }
      // Mostrar un mensaje de error más descriptivo
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
        if (DEBUG) {
          // Registramos el error específico en un logger
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadExamAndGroups();
  }, [id, loadExamAndGroups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error al cargar el examen</p>
      </div>
    );
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Generar Hojas de Respuesta</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="group">Grupo</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.nombre} - {group.materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Tamaño de papel</Label>
              <RadioGroup value={paperSize} onValueChange={(value: 'LETTER' | 'A4') => setPaperSize(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LETTER" id="letter" />
                  <Label htmlFor="letter">Carta (Letter)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A4" id="a4" />
                  <Label htmlFor="a4">A4</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {selectedGroupId && exam && (
          <Card>
            <CardHeader>
              <CardTitle>Generar PDF</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGroup && (
                <AllAnswerSheets 
                  exam={exam} 
                  group={selectedGroup} 
                  paperSize={paperSize} 
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 