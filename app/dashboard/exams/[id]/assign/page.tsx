"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Student } from "@/lib/types/database";

interface Grupo {
  id: string;
  nombre: string;
  materia_id: string;
  estado: 'activo' | 'archivado';
  estudiantes: Student[];
}

interface Asignacion {
  grupo_id: string;
  fecha_aplicacion: string;
  duracion_minutos: number;
}

export default function AssignExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    fetchExamDetails();
  }, []);

  useEffect(() => {
    if (exam?.materia_id) {
      fetchGrupos();
    }
  }, [exam?.materia_id]);

  async function fetchExamDetails() {
    try {
      const { data, error } = await supabase
        .from("examenes")
        .select(`
          *,
          materias(nombre),
          examen_grupo(
            grupo:grupo_id(id, nombre),
            fecha_aplicacion,
            duracion_minutos,
            estado
          )
        `)
        .eq("id", examId)
        .single();

      if (error) throw error;
      setExam(data);

      // Inicializar asignaciones con los grupos ya asignados
      const asignacionesIniciales = data.examen_grupo?.map((ag: any) => ({
        grupo_id: ag.grupo.id,
        fecha_aplicacion: ag.fecha_aplicacion || "",
        duracion_minutos: ag.duracion_minutos || data.duracion_minutos,
      })) || [];
      setAsignaciones(asignacionesIniciales);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast.error("Error al cargar los detalles del examen");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select(`
          *,
          estudiantes:estudiante_grupo(
            estudiante:estudiantes(
              id,
              nombres,
              apellidos,
              identificacion
            )
          )
        `)
        .eq("materia_id", exam.materia_id)
        .eq("estado", "activo");

      if (error) throw error;

      // Transformar los datos para que coincidan con la interfaz Grupo
      const gruposFormateados = data.map((grupo: any) => ({
        ...grupo,
        estudiantes: grupo.estudiantes.map((e: any) => ({
          id: e.estudiante.id,
          nombres: e.estudiante.nombres,
          apellidos: e.estudiante.apellidos,
          identificacion: e.estudiante.identificacion
        }))
      }));

      setGrupos(gruposFormateados);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Error al cargar los grupos");
    }
  }

  const handleGrupoToggle = (grupoId: string) => {
    setAsignaciones((prev) => {
      const exists = prev.some((a) => a.grupo_id === grupoId);
      if (exists) {
        return prev.filter((a) => a.grupo_id !== grupoId);
      } else {
        return [
          ...prev,
          {
            grupo_id: grupoId,
            fecha_aplicacion: "",
            duracion_minutos: exam.duracion_minutos,
          },
        ];
      }
    });
  };

  const handleAsignacionChange = (
    grupoId: string,
    field: "fecha_aplicacion" | "duracion_minutos",
    value: string | number
  ) => {
    setAsignaciones((prev) =>
      prev.map((a) =>
        a.grupo_id === grupoId ? { ...a, [field]: value } : a
      )
    );
  };

  async function handleSave() {
    try {
      setSaving(true);

      // Eliminar asignaciones existentes
      const { error: deleteError } = await supabase
        .from("examen_grupo")
        .delete()
        .eq("examen_id", examId);

      if (deleteError) throw deleteError;

      // Insertar nuevas asignaciones
      if (asignaciones.length > 0) {
        const { error: insertError } = await supabase
          .from("examen_grupo")
          .insert(
            asignaciones.map((a) => ({
              examen_id: examId,
              grupo_id: a.grupo_id,
              fecha_aplicacion: a.fecha_aplicacion || null,
              duracion_minutos: a.duracion_minutos,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Grupos asignados correctamente");
      router.push("/dashboard/exams");
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("Error al guardar las asignaciones");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/exams")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Asignar Grupos - {exam.titulo}
          </h2>
          <p className="text-muted-foreground">
            Selecciona los grupos a los que se aplicará este examen
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grupos Disponibles</CardTitle>
          <CardDescription>
            Marca los grupos a los que deseas asignar este examen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {grupos.map((grupo) => {
              const asignacion = asignaciones.find((a) => a.grupo_id === grupo.id);
              const isSelected = !!asignacion;

              return (
                <div
                  key={grupo.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <Checkbox
                    id={grupo.id}
                    checked={isSelected}
                    onCheckedChange={() => handleGrupoToggle(grupo.id)}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={grupo.id}>{grupo.nombre}</Label>
                    {isSelected && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <Label>Fecha de aplicación</Label>
                          <Input
                            type="datetime-local"
                            value={asignacion.fecha_aplicacion}
                            onChange={(e) =>
                              handleAsignacionChange(
                                grupo.id,
                                "fecha_aplicacion",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Duración (minutos)</Label>
                          <Input
                            type="number"
                            value={asignacion.duracion_minutos}
                            onChange={(e) =>
                              handleAsignacionChange(
                                grupo.id,
                                "duracion_minutos",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Asignaciones
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 