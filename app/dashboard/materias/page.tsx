"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, School } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfesor } from "@/lib/hooks/useProfesor";
import type { Database } from "@/lib/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"];
type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

const materiaSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  entidad_id: z.string().optional(),
});

type MateriaFormValues = z.infer<typeof materiaSchema>;

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { profesor } = useProfesor();
  
  const form = useForm<MateriaFormValues>({
    resolver: zodResolver(materiaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      entidad_id: "",
    },
  });

  useEffect(() => {
    if (profesor) {
      loadMaterias();
      loadEntidades();
    }
  }, [profesor]);

  useEffect(() => {
    if (editingMateria) {
      form.reset({
        nombre: editingMateria.nombre,
        descripcion: editingMateria.descripcion || "",
        entidad_id: editingMateria.entidad_id || "",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        entidad_id: "",
      });
    }
  }, [editingMateria, form]);

  const loadMaterias = async () => {
    if (!profesor) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("materias")
        .select(`
          *,
          entidades_educativas (
            id,
            nombre
          )
        `)
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
    } finally {
      setLoading(false);
    }
  };

  const loadEntidades = async () => {
    try {
      const { data, error } = await supabase
        .from("entidades_educativas")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setEntidades(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar entidades",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const onSubmit = async (data: MateriaFormValues) => {
    if (!profesor) return;
    
    try {
      if (editingMateria) {
        // Actualizar
        const { error } = await supabase
          .from("materias")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            entidad_id: data.entidad_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMateria.id);

        if (error) throw error;
        toast({
          title: "Materia actualizada",
          description: "La materia ha sido actualizada correctamente.",
        });
      } else {
        // Crear nueva
        const { error } = await supabase
          .from("materias")
          .insert({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            entidad_id: data.entidad_id || null,
            profesor_id: profesor.id,
          });

        if (error) throw error;
        toast({
          title: "Materia creada",
          description: "La materia ha sido creada correctamente.",
        });
      }
      
      setOpenDialog(false);
      setEditingMateria(null);
      form.reset();
      loadMaterias();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al guardar materia",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
    }
  };

  const handleEdit = (materia: Materia) => {
    setEditingMateria(materia);
    setOpenDialog(true);
  };

  const confirmDeleteMateria = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from("materias")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      
      toast({
        title: "Materia eliminada",
        description: "La materia ha sido eliminada correctamente.",
      });
      
      loadMaterias();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar materia",
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
          <h1 className="text-3xl font-bold tracking-tight">Materias</h1>
          <p className="text-muted-foreground">
            Administra las materias que impartes
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMateria(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva materia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingMateria ? "Editar materia" : "Nueva materia"}</DialogTitle>
              <DialogDescription>
                {editingMateria 
                  ? "Actualiza la información de la materia." 
                  : "Ingresa los datos de la nueva materia."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre*</Label>
                <Input
                  id="nombre"
                  {...form.register("nombre")}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción breve de la materia"
                  {...form.register("descripcion")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entidad">Entidad educativa</Label>
                <Select
                  onValueChange={(value: string) => form.setValue("entidad_id", value)}
                  value={form.watch("entidad_id") || ""}
                >
                  <SelectTrigger id="entidad">
                    <SelectValue placeholder="Selecciona una entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguna</SelectItem>
                    {entidades.map((entidad) => (
                      <SelectItem key={entidad.id} value={entidad.id}>
                        {entidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si no asocias la materia a una entidad, será considerada como particular.
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setOpenDialog(false);
                    setEditingMateria(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMateria ? "Actualizar" : "Crear"}
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
      ) : materias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="mb-4 text-center text-muted-foreground">
              No hay materias registradas.
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar materia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <Card key={materia.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-xl">{materia.nombre}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(materia)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDeletingId(materia.id);
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* @ts-ignore */}
                {materia.entidades_educativas && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <School className="mr-1 h-3 w-3" />
                    {/* @ts-ignore */}
                    <span>{materia.entidades_educativas.nombre}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {materia.descripcion && (
                  <p className="text-sm text-muted-foreground">{materia.descripcion}</p>
                )}
              </CardContent>
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
              ¿Estás seguro de que deseas eliminar esta materia? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMateria}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 