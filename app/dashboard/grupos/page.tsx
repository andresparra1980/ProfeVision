"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, Users, BookOpen, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfesor } from "@/lib/hooks/useProfesor";
import Link from "next/link";
import type { Database } from "@/lib/types/database";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & {
  materias: {
    id: string;
    nombre: string;
  } | null;
  estudiantes_count: number;
};

type Materia = Database["public"]["Tables"]["materias"]["Row"];

const grupoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  materia_id: z.string({ required_error: "Selecciona una materia" }),
  año_escolar: z.string().optional(),
});

type GrupoFormValues = z.infer<typeof grupoSchema>;

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { profesor } = useProfesor();
  
  const form = useForm<GrupoFormValues>({
    resolver: zodResolver(grupoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      materia_id: "",
      año_escolar: new Date().getFullYear().toString(),
    },
  });

  useEffect(() => {
    if (profesor) {
      loadGrupos();
      loadMaterias();
    }
  }, [profesor]);

  useEffect(() => {
    if (editingGrupo) {
      form.reset({
        nombre: editingGrupo.nombre,
        descripcion: editingGrupo.descripcion || "",
        materia_id: editingGrupo.materia_id,
        año_escolar: editingGrupo.año_escolar || "",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        materia_id: "",
        año_escolar: new Date().getFullYear().toString(),
      });
    }
  }, [editingGrupo, form]);

  const loadGrupos = async () => {
    if (!profesor) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("grupos")
        .select(`
          *,
          materias (
            id,
            nombre
          ),
          estudiantes_count:estudiante_grupo(count)
        `)
        .eq("profesor_id", profesor.id)
        .order("nombre");

      if (error) throw error;
      setGrupos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar grupos",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMaterias = async () => {
    if (!profesor) return;
    
    try {
      const { data, error } = await supabase
        .from("materias")
        .select("*")
        .eq("profesor_id", profesor.id)
        .order("nombre");

      if (error) throw error;
      setMaterias(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar materias",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const onSubmit = async (data: GrupoFormValues) => {
    if (!profesor) return;
    
    try {
      if (editingGrupo) {
        // Actualizar
        const { error } = await supabase
          .from("grupos")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            materia_id: data.materia_id,
            año_escolar: data.año_escolar || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGrupo.id);

        if (error) throw error;
        toast({
          title: "Grupo actualizado",
          description: "El grupo ha sido actualizado correctamente.",
        });
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from("grupos")
          .insert({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            materia_id: data.materia_id,
            profesor_id: profesor.id,
            año_escolar: data.año_escolar || null,
          });

        if (error) throw error;
        toast({
          title: "Grupo creado",
          description: "El grupo ha sido creado correctamente.",
        });
      }
      
      setOpenDialog(false);
      setEditingGrupo(null);
      form.reset();
      loadGrupos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al guardar grupo",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setOpenDialog(true);
  };

  const confirmDeleteGrupo = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      
      toast({
        title: "Grupo eliminado",
        description: "El grupo ha sido eliminado correctamente.",
      });
      
      loadGrupos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar grupo",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grupos</h1>
          <p className="text-muted-foreground">
            Administra tus grupos de estudiantes
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGrupo(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingGrupo ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
              <DialogDescription>
                {editingGrupo 
                  ? "Actualiza la información del grupo." 
                  : "Ingresa los datos del nuevo grupo."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre*</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: 10-A, Grupo Mañana, etc."
                  {...form.register("nombre")}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="materia">Materia*</Label>
                <Select
                  onValueChange={(value: string) => form.setValue("materia_id", value)}
                  value={form.watch("materia_id")}
                >
                  <SelectTrigger id="materia">
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.length > 0 ? (
                      materias.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-materias" disabled>
                        No hay materias registradas
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.materia_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.materia_id.message}</p>
                )}
                {materias.length === 0 && (
                  <p className="text-xs text-destructive">
                    Debes crear al menos una materia antes de crear un grupo.
                    <Link href="/dashboard/materias" className="ml-1 text-primary hover:underline">
                      Crear materia
                    </Link>
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="año_escolar">Año escolar</Label>
                <Input
                  id="año_escolar"
                  placeholder="Ej: 2024"
                  {...form.register("año_escolar")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Información adicional sobre el grupo"
                  {...form.register("descripcion")}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setOpenDialog(false);
                    setEditingGrupo(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={materias.length === 0}>
                  {editingGrupo ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="mb-4 text-center text-muted-foreground">
              No hay grupos registrados.
            </p>
            <Button onClick={() => setOpenDialog(true)} disabled={materias.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear grupo
            </Button>
            {materias.length === 0 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Debes crear al menos una materia antes de crear un grupo.
                <Link href="/dashboard/materias" className="ml-1 font-medium text-primary hover:underline">
                  Ir a crear materia
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <Card key={grupo.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-xl">{grupo.nombre}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(grupo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDeletingId(grupo.id);
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {grupo.año_escolar && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>Año: {grupo.año_escolar}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  {/* @ts-ignore */}
                  {grupo.materias && (
                    <div className="flex items-center text-sm">
                      <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                      {/* @ts-ignore */}
                      <span>{grupo.materias.nombre}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {/* @ts-ignore */}
                    <span>{grupo.estudiantes_count || 0} estudiantes</span>
                  </div>
                  {grupo.descripcion && (
                    <p className="text-sm text-muted-foreground mt-2">{grupo.descripcion}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link 
                  href={`/dashboard/grupos/${grupo.id}`} 
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    Administrar estudiantes
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer y eliminará la relación con todos los estudiantes asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGrupo}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 