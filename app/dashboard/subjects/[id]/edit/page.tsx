"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    entidad_id: "",
  });

  useEffect(() => {
    fetchSubject();
    fetchEntities();
  }, [subjectId]);

  async function fetchSubject() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("materias")
        .select("*, entidades_educativas(nombre)")
        .eq("id", subjectId)
        .eq("profesor_id", session.user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la materia",
          variant: "destructive",
        });
        router.push("/dashboard/subjects");
        return;
      }

      // Verificar si hay una entidad educativa asociada
      if (!data.entidad_id) {
        toast({
          title: "Actualización requerida",
          description: "Esta materia necesita ser actualizada con una entidad educativa",
          variant: "destructive",
        });
      }

      setSubject(data);
      setFormData({
        nombre: data.nombre || "",
        descripcion: data.descripcion || "",
        entidad_id: data.entidad_id || "",
      });
    } catch (error) {
      console.error("Error fetching subject:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la materia",
        variant: "destructive",
      });
      router.push("/dashboard/subjects");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEntities() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Obtener las entidades educativas a las que pertenece el profesor
      const { data, error } = await supabase
        .from("profesor_entidad")
        .select("entidad_id, entidades_educativas(id, nombre)")
        .eq("profesor_id", session.user.id);

      if (error) {
        console.error("Error en la consulta de entidades educativas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las entidades educativas",
          variant: "destructive",
        });
        return;
      }
      
      // Transformar el resultado para tener un array de entidades
      const entitiesList = data.map((item: any) => ({
        id: item.entidades_educativas.id,
        nombre: item.entidades_educativas.nombre
      }));

      setEntities(entitiesList || []);
    } catch (error) {
      console.error("Error inesperado:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);

      // Validaciones
      if (!formData.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la materia es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!formData.entidad_id || formData.entidad_id === 'none') {
        toast({
          title: "Error",
          description: "Debes seleccionar una entidad educativa",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Actualizar materia
      const { error } = await supabase
        .from("materias")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          entidad_id: formData.entidad_id,
        })
        .eq("id", subjectId)
        .eq("profesor_id", session.user.id);

      if (error) {
        console.error("Error de Supabase al actualizar:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        let errorMessage = "No se pudo actualizar la materia";
        
        // Personalizar mensajes según el tipo de error
        if (error.code === "23505") {
          errorMessage = "Ya existe una materia con este nombre";
        } else if (error.code === "23503") {
          errorMessage = "La entidad educativa seleccionada no existe";
        } else if (error.code === "42501") {
          errorMessage = "No tienes permisos para actualizar esta materia";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Materia actualizada correctamente",
      });

      // Redirigir a la página de materias
      router.push("/dashboard/subjects");
    } catch (error: any) {
      // Mostrar información más detallada sobre el error
      console.error("Error al actualizar materia:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        error
      });
      
      toast({
        title: "Error",
        description: "No se pudo actualizar la materia. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <p>No se encontró la materia solicitada.</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/subjects")}
        >
          Volver a Materias
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/dashboard/subjects")}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Materias
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Editar Materia</h2>
        <p className="text-muted-foreground">
          Actualiza la información de la materia
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Materia</CardTitle>
            <CardDescription>
              Modifica los detalles de la materia que impartes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Materia *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Matemáticas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Breve descripción de la materia"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entidad_id">Entidad Educativa *</Label>
              <Select
                value={formData.entidad_id}
                onValueChange={(value) => handleSelectChange("entidad_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar entidad" />
                </SelectTrigger>
                <SelectContent>
                  {entities.length === 0 ? (
                    <SelectItem value="no-entities" disabled>
                      No hay entidades disponibles
                    </SelectItem>
                  ) : (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Todas las materias deben estar asociadas a una entidad educativa.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push("/dashboard/subjects")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 