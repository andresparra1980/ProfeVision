"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export default function CreateSubjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    entidad_educativa_id: "",
  });

  useEffect(() => {
    fetchEntities();
  }, []);

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
        .select("entidad_educativa_id, entidades_educativas(id, nombre)")
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
      
      // Si no hay error pero tampoco datos, simplemente establecemos un array vacío
      if (!data || data.length === 0) {
        setEntities([]);
        return;
      }
      
      // Transformar el resultado para tener un array de entidades
      const entitiesList = data.map((item: any) => ({
        id: item.entidades_educativas.id,
        nombre: item.entidades_educativas.nombre
      }));

      setEntities(entitiesList || []);
    } catch (error) {
      // Solo mostramos el toast si es un error inesperado
      console.error("Error inesperado al cargar entidades:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al cargar las entidades",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);

      // Validaciones
      if (!formData.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la materia es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!formData.entidad_educativa_id || formData.entidad_educativa_id === 'none') {
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

      // Crear materia
      const { data, error } = await supabase
        .from("materias")
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          profesor_id: session.user.id,
          entidad_educativa_id: formData.entidad_educativa_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error de Supabase:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        let errorMessage = "No se pudo crear la materia";
        
        // Personalizar mensajes según el tipo de error
        if (error.code === "23505") {
          errorMessage = "Ya existe una materia con este nombre";
        } else if (error.code === "23503") {
          errorMessage = "La entidad educativa seleccionada no existe";
        } else if (error.code === "42501") {
          errorMessage = "No tienes permisos para crear materias";
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
        description: "Materia creada correctamente",
      });

      // Redirigir a la página de materias
      router.push("/dashboard/subjects");
    } catch (error: any) {
      // Mostrar información más detallada sobre el error
      console.error("Error al crear materia:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        error
      });
      
      toast({
        title: "Error",
        description: "No se pudo crear la materia. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Crear Materia</h2>
        <p className="text-muted-foreground">
          Añade una nueva materia a tu perfil
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Materia</CardTitle>
            <CardDescription>
              Proporciona los detalles de la materia que impartes
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
              <Label htmlFor="entidad_educativa_id">Entidad Educativa *</Label>
              <Select
                value={formData.entidad_educativa_id}
                onValueChange={(value) => handleSelectChange("entidad_educativa_id", value)}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Materia"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 