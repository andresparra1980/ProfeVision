"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, School, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
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

export default function SubjectsPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [materiaNameToConfirmDelete, setMateriaNameToConfirmDelete] = useState<string | null>(null);
  const [typedMateriaName, setTypedMateriaName] = useState<string>("");
  const { profesor } = useProfesor();
  
  const form = useForm<MateriaFormValues>({
    resolver: zodResolver(materiaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      entidad_id: "none",
    },
  });

  // Helper function for consistent error logging
  const handleSupabaseError = useCallback((context: string, error: unknown) => {
    const errorObj = error as Error;
    const isSupabaseError = typeof errorObj === 'object' && errorObj !== null;
    // Safely access status, code, and details
    let status: number | undefined = undefined;
    let code: string | undefined = undefined;
    let details: string | undefined = undefined;

    if (isSupabaseError) {
      if ('status' in errorObj) {
        status = Number((errorObj as { status?: unknown }).status);
      }
      if ('code' in errorObj) {
        code = String((errorObj as { code?: unknown }).code);
      }
      if ('details' in errorObj) {
        details = String((errorObj as { details?: unknown }).details);
      }
    }

    logger.error(`[SubjectsPage] ${context}:`, { 
      message: errorObj.message, 
      status: status,
      code: code,
      details: details,
      errorObject: errorObj 
    });
    
    toast({ 
      variant: "destructive", 
      title: `Error en ${context}`, 
      description: `Error: ${errorObj?.message || 'Desconocido'}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`
    });
  }, []);

  const loadMaterias = useCallback(async () => {
    if (!profesor) return;
    logger.log('[SubjectsPage] Loading materias...');
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
    } catch (error: unknown) {
      handleSupabaseError('al cargar materias', error);
    } finally {
      setLoading(false);
    }
  }, [profesor, handleSupabaseError]);

  const loadEntidades = useCallback(async () => {
    logger.log('[SubjectsPage] Loading entidades...');
    try {
      const { data, error } = await supabase
        .from("entidades_educativas")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setEntidades(data || []);
    } catch (error: unknown) {
      handleSupabaseError('al cargar instituciones', error);
    }
  }, [handleSupabaseError]);

  useEffect(() => {
    if (profesor) {
      loadMaterias();
      loadEntidades();
    }
  }, [profesor, loadMaterias, loadEntidades]);

  useEffect(() => {
    if (editingMateria) {
      form.reset({
        nombre: editingMateria.nombre,
        descripcion: editingMateria.descripcion || "",
        entidad_id: editingMateria.entidad_id || "none",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        entidad_id: "none",
      });
    }
  }, [editingMateria, form]);

  const onSubmit = async (data: MateriaFormValues) => {
    if (!profesor) return;
    logger.log('[SubjectsPage] Submitting subject form...');
    try {
      const entidad_id = data.entidad_id === "none" ? null : data.entidad_id;
      
      if (editingMateria) {
        // Update
        const { error } = await supabase
          .from("materias")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            entidad_id: entidad_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMateria.id);

        if (error) throw error;
        toast({
          title: "Materia actualizada",
          description: "La materia ha sido actualizada correctamente.",
        });
      } else {
        // Create new
        const { error } = await supabase
          .from("materias")
          .insert({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            entidad_id: entidad_id,
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
    } catch (error: unknown) {
      handleSupabaseError('al guardar materia', error);
    }
  };

  const handleEdit = (materia: Materia) => {
    setEditingMateria(materia);
    setOpenDialog(true);
  };

  const confirmDeleteMateria = async () => {
    if (!deletingId) return;
    logger.log(`[SubjectsPage] Attempting to delete subject ID: ${deletingId}`);
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
    } catch (error: unknown) {
      handleSupabaseError('al eliminar materia', error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
      setMateriaNameToConfirmDelete(null);
      setTypedMateriaName("");
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
        <Dialog open={openDialog} onOpenChange={setOpenDialog} modal={true}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMateria(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva materia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] bg-[#FAFAF4] dark:bg-[#171717]">
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
                  className="bg-white dark:bg-[#1E1E1F]"
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
                  placeholder="Breve descripción de la materia"
                  className="bg-white dark:bg-[#1E1E1F]"
                  {...form.register("descripcion")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entidad">Institución educativa</Label>
                <Select
                  onValueChange={(value: string) => form.setValue("entidad_id", value)}
                  value={form.watch("entidad_id")}
                >
                  <SelectTrigger id="entidad" className="bg-white dark:bg-[#1E1E1F]">
                    <SelectValue placeholder="Selecciona una institución" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {entidades.map((entidad) => (
                      <SelectItem key={entidad.id} value={entidad.id}>
                        {entidad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si no asocias la materia con una institución, se considerará como privada.
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
                        setMateriaNameToConfirmDelete(materia.nombre);
                        setTypedMateriaName("");
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* @ts-expect-error - entidades_educativas puede existir pero TypeScript no lo reconoce */}
                {materia.entidades_educativas && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <School className="mr-1 h-3 w-3" />
                    {/* @ts-expect-error - entidades_educativas.nombre puede existir pero TypeScript no lo reconoce */}
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

      {/* Delete confirmation dialog */}
      <Dialog 
        open={confirmDelete} 
        onOpenChange={(isOpen) => {
          setConfirmDelete(isOpen);
          if (!isOpen) {
            setMateriaNameToConfirmDelete(null);
            setTypedMateriaName("");
          }
        }} 
        modal={true}
      >
        <DialogContent className="sm:max-w-md border-red-500 dark:border-red-700 shadow-xl rounded-lg bg-card dark:bg-background">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-2xl font-bold">
              <TriangleAlert className="h-7 w-7 mr-2 text-red-600 dark:text-red-400" />
              ¡ADVERTENCIA! Eliminación Permanente
            </DialogTitle>
            <DialogDescription className="mt-2 space-y-2">
              <p>
                Está a punto de eliminar la materia{" "}
                <span className="font-semibold">{materiaNameToConfirmDelete || "seleccionada"}</span>.
              </p>
              <p>
                Esta acción es <span className="font-semibold uppercase">IRREVERSIBLE</span> y resultará en:
              </p>
              <ul className="list-disc list-inside ml-4 text-sm">
                <li>Eliminación de todos los <span className="font-semibold">grupos</span> asociados.</li>
                <li>Eliminación de todos los <span className="font-semibold">exámenes</span> creados para esta materia.</li>
                <li>Eliminación de todos los <span className="font-semibold">resultados de exámenes y calificaciones</span> vinculadas.</li>
              </ul>
              <p className="mt-3">
                Para confirmar esta acción y proceder con la eliminación, por favor escriba el nombre exacto de la materia en el campo de abajo.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Label htmlFor="materia-confirm-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Escriba &quot;<span className="font-semibold text-red-600 dark:text-red-400">{materiaNameToConfirmDelete}</span>&quot; para confirmar:
            </Label>
            <Input
              id="materia-confirm-name"
              value={typedMateriaName}
              onChange={(e) => setTypedMateriaName(e.target.value)}
              placeholder="Nombre exacto de la materia"
              className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDelete(false);
                setMateriaNameToConfirmDelete(null);
                setTypedMateriaName("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMateria}
              disabled={typedMateriaName !== materiaNameToConfirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4 " />
              Sí, eliminar esta materia y sus datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 