"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Printer, Eye, Download, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { ExamPDF } from "@/components/exam/exam-pdf";
import { Separator } from "@/components/ui/separator";

// Tipos
interface ExamDetails {
  id: string;
  titulo: string;
  descripcion: string | null;
  instrucciones: string | null;
  duracion_minutos: number;
  puntaje_total: number;
  created_at: string;
  materias: {
    id: string;
    nombre: string;
    profesor: {
      id: string;
      nombres: string;
      apellidos: string;
      cargo: string;
    };
    entidad: {
      id: string;
      nombre: string;
      tipo: string;
    }
  };
  preguntas: Array<{
    id: string;
    texto: string;
    puntaje: number;
    orden: number;
    tipo_pregunta: {
      nombre: string;
    };
    opciones_respuesta: Array<{
      id: string;
      texto: string;
      es_correcta: boolean;
    }>;
  }>;
  examen_grupo?: Array<{
    grupo: {
      id: string;
      nombre: string;
    };
    fecha_aplicacion: string | null;
    duracion_minutos: number;
  }>;
}

export default function ExportExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [paperSize, setPaperSize] = useState("letter"); // letter, a4, legal
  const [previewing, setPreviewing] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  async function fetchExamDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("examenes")
        .select(`
          *,
          materias:materia_id (
            id,
            nombre,
            entidad:entidad_id (
              id,
              nombre,
              tipo
            ),
            profesor:profesor_id (
              id,
              nombres,
              apellidos,
              cargo
            )
          ),
          preguntas (
            id,
            texto,
            puntaje,
            orden,
            tipo_pregunta:tipo_id (nombre),
            opciones_respuesta (*)
          ),
          examen_grupo (
            grupo:grupo_id (
              id,
              nombre
            ),
            fecha_aplicacion,
            duracion_minutos
          )
        `)
        .eq("id", examId)
        .single();

      if (error) throw error;
      
      // Ordenar preguntas por orden
      if (data.preguntas) {
        data.preguntas.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
      }
      
      setExam(data as ExamDetails);
      
      // Si solo hay un grupo asignado, seleccionarlo automáticamente
      if (data.examen_grupo && data.examen_grupo.length === 1) {
        setSelectedGroupId(data.examen_grupo[0].grupo.id);
      }
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del examen",
        variant: "destructive",
      });
      router.push("/dashboard/exams");
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (type: 'questions' | 'answers') => {
    try {
      if (!exam) return;

      if (type === 'questions') {
        // Obtener el grupo seleccionado
        const selectedGroup = exam.examen_grupo?.find(eg => eg.grupo.id === selectedGroupId);

        // Generar el PDF
        const blob = await pdf(
          <ExamPDF 
            exam={exam} 
            paperSize={paperSize as "letter" | "a4" | "legal"}
            selectedGroup={selectedGroup?.grupo}
          />
        ).toBlob();
        
        // Crear URL y descargar
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = selectedGroup 
          ? `${exam.titulo.toLowerCase().replace(/\s+/g, '-')}-${selectedGroup.grupo.nombre.toLowerCase().replace(/\s+/g, '-')}-preguntas.pdf`
          : `${exam.titulo.toLowerCase().replace(/\s+/g, '-')}-preguntas.pdf`;
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Éxito",
          description: "El formato de preguntas ha sido generado",
        });
      }
    } catch (error) {
      console.error("Error exporting exam:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el formato",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p>No se encontró el examen solicitado.</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/exams")}
        >
          Volver a Exámenes
        </Button>
      </div>
    );
  }

  if (previewing && exam) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Button 
              variant="ghost"
              onClick={() => setPreviewing(false)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <Button
              onClick={() => handleExport('questions')}
            >
              <Printer className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </div>
          <div className="flex-1 w-full h-full bg-gray-100">
            <PDFViewer className="w-full h-full">
              <ExamPDF exam={exam} paperSize={paperSize as "letter" | "a4" | "legal"} />
            </PDFViewer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/dashboard/exams")}
            className="mb-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Exámenes
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{exam.titulo}</h2>
          <p className="text-muted-foreground">
            {exam.materias?.nombre} | Exportar Formatos
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Formatos Disponibles</CardTitle>
            <CardDescription>
              Selecciona el tipo de formato que deseas generar
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-lg font-semibold">Hoja de Preguntas</h3>
              <p className="text-sm text-muted-foreground">
                Formato con las preguntas del examen para entregar a los estudiantes
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setPreviewing(true)}>
                  <Eye className="mr-2 h-4 w-4" /> Vista Previa
                </Button>
                <Button onClick={() => handleExport('questions')}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-lg font-semibold">Hojas de Respuesta</h3>
              <p className="text-sm text-muted-foreground">
                Formatos personalizados para cada estudiante con código QR y marcas de alineación
              </p>
              <Button onClick={() => router.push(`/dashboard/exams/${examId}/responses`)}>
                <FileOutput className="mr-2 h-4 w-4" /> Generar Hojas de Respuesta
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Exportación</CardTitle>
            <CardDescription>
              Selecciona el grupo y el tamaño de papel para exportar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selección de grupo */}
            {exam.examen_grupo && exam.examen_grupo.length > 0 ? (
              <div className="space-y-2">
                <Label>Grupo</Label>
                <RadioGroup
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {exam.examen_grupo.map((eg) => (
                    <Label
                      key={eg.grupo.id}
                      htmlFor={eg.grupo.id}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value={eg.grupo.id} id={eg.grupo.id} className="sr-only" />
                      <span className="text-sm font-medium">{eg.grupo.nombre}</span>
                      {eg.fecha_aplicacion && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(eg.fecha_aplicacion), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No hay grupos asignados a este examen.
                <Button 
                  variant="link" 
                  onClick={() => router.push(`/dashboard/exams/${examId}/assign`)}
                  className="ml-2"
                >
                  Asignar grupos
                </Button>
              </div>
            )}

            {/* Tamaño de papel */}
            <div className="space-y-2">
              <Label>Tamaño de Papel</Label>
              <RadioGroup value={paperSize} onValueChange={setPaperSize}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="letter" id="letter" />
                  <Label htmlFor="letter">Carta (Letter)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="a4" id="a4" />
                  <Label htmlFor="a4">A4</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="legal" id="legal" />
                  <Label htmlFor="legal">Legal</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 