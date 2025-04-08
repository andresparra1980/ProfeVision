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
import { Building2 } from "lucide-react";
import { Plus } from "lucide-react";
import { BookOpen } from "lucide-react";

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<any[]>([]);
  const [hasEntities, setHasEntities] = useState(false);
  const [isCheckingEntities, setIsCheckingEntities] = useState(true);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    instrucciones: "",
    materia_id: "",
    duracion: 60,
    puntaje_total: 100,
  });

  useEffect(() => {
    checkEntities();
  }, []);

  useEffect(() => {
    if (hasEntities) {
      fetchMaterias();
    }
  }, [hasEntities]);

  async function checkEntities() {
    try {
      setIsCheckingEntities(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Verificar si el profesor tiene entidades educativas asociadas
      const { data, error } = await supabase
        .from("profesor_entidad")
        .select("id")
        .eq("profesor_id", session.user.id);

      if (error) {
        console.error("Error al verificar entidades:", error);
        setHasEntities(false);
        return;
      }

      // Si no tiene entidades, setHasEntities será false
      setHasEntities(data && data.length > 0);
    } catch (error) {
      console.error("Error inesperado al verificar entidades:", error);
      setHasEntities(false);
    } finally {
      setIsCheckingEntities(false);
    }
  }

  async function fetchMaterias() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("profesor_id", session.user.id)
        .order("nombre", { ascending: true });

      if (error) throw error;
      
      setMaterias(data || []);
    } catch (error) {
      console.error("Error fetching materias:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las materias",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);

      // Validaciones
      if (!formData.titulo.trim()) {
        toast({
          title: "Error",
          description: "El título del examen es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!formData.materia_id) {
        toast({
          title: "Error",
          description: "Debes seleccionar una materia",
          variant: "destructive",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Crear examen
      const { data, error } = await supabase
        .from("examenes")
        .insert({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          instrucciones: formData.instrucciones,
          materia_id: formData.materia_id,
          profesor_id: session.user.id,
          estado: "borrador",
          duracion_minutos: formData.duracion,
          puntaje_total: formData.puntaje_total,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Examen creado correctamente",
      });

      // Redirigir a la página de edición del examen
      router.push(`/dashboard/exams/${data.id}/edit`);
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el examen",
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = parseInt(value, 10) || 0;
    setFormData((prev) => ({ ...prev, [name]: numberValue }));
  };

  // Si está cargando la verificación de entidades, mostrar spinner
  if (isCheckingEntities) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay entidades educativas, mostrar un mensaje y redirigir
  if (!hasEntities) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Crear Examen</h2>
          <p className="text-muted-foreground">
            Define la información básica del examen
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Entidad Educativa Requerida</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Debes crear o unirte a al menos una entidad educativa antes de poder crear exámenes.
              Los exámenes deben estar asociados a una materia, y las materias a una entidad educativa.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/entities")}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Entidad Educativa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay materias, mostrar un mensaje
  if (materias.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Crear Examen</h2>
          <p className="text-muted-foreground">
            Define la información básica del examen
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 text-center flex flex-col items-center justify-center space-y-4">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Materia Requerida</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Debes crear al menos una materia antes de poder crear exámenes.
              Los exámenes deben estar asociados a una materia.
            </p>
            <Button 
              onClick={() => router.push("/dashboard/subjects/create")}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Materia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Crear Examen</h2>
        <p className="text-muted-foreground">
          Define la información básica del examen
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Proporciona los detalles principales del examen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título del Examen *</Label>
              <Input
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ej. Examen Parcial de Matemáticas"
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
                placeholder="Breve descripción del contenido del examen"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrucciones">Instrucciones</Label>
              <Textarea
                id="instrucciones"
                name="instrucciones"
                value={formData.instrucciones}
                onChange={handleChange}
                placeholder="Instrucciones para los estudiantes"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="materia">Materia *</Label>
                <Select
                  value={formData.materia_id}
                  onValueChange={(value) => handleSelectChange("materia_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.length === 0 ? (
                      <SelectItem value="no-materias" disabled>
                        No hay materias disponibles
                      </SelectItem>
                    ) : (
                      materias.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (minutos)</Label>
                <Input
                  id="duracion"
                  name="duracion"
                  type="number"
                  min={1}
                  value={formData.duracion}
                  onChange={handleNumberChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntaje_total">Puntaje Total</Label>
              <Input
                id="puntaje_total"
                name="puntaje_total"
                type="number"
                min={1}
                value={formData.puntaje_total}
                onChange={handleNumberChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push("/dashboard/exams")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Examen"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 