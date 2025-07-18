"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Database } from "@/lib/types/database";

type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

type EntidadFormValues = {
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  tipo: string;
  ciudad?: string;
  pais?: string;
};

export default function EntidadesPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.entidades');
  
  const entidadSchema = z.object({
    nombre: z.string().min(2, { message: t('form.nameError') }),
    descripcion: z.string().optional(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email({ message: t('form.emailError') }).optional().or(z.literal("")),
    website: z.string().url({ message: t('form.websiteError') }).optional().or(z.literal("")),
    tipo: z.string().default("Escolar"),
    ciudad: z.string().optional(),
    pais: z.string().optional(),
  });
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntidad, setEditingEntidad] = useState<EntidadEducativa | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const form = useForm<EntidadFormValues>({
    resolver: zodResolver(entidadSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      direccion: "",
      telefono: "",
      email: "",
      website: "",
      tipo: "Escolar",
      ciudad: "",
      pais: "",
    },
  });

  useEffect(() => {
    loadEntidades();
  }, []);

  useEffect(() => {
    if (editingEntidad) {
      form.reset({
        nombre: editingEntidad.nombre,
        descripcion: "",
        direccion: editingEntidad.direccion || "",
        telefono: editingEntidad.telefono || "",
        email: editingEntidad.email || "",
        website: editingEntidad.website || "",
        tipo: editingEntidad.tipo,
        ciudad: editingEntidad.ciudad || "",
        pais: editingEntidad.pais || "",
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        direccion: "",
        telefono: "",
        email: "",
        website: "",
        tipo: "Escolar",
        ciudad: "",
        pais: "",
      });
    }
  }, [editingEntidad, form]);

  const loadEntidades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("entidades_educativas")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setEntidades(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.";
      toast({
        variant: "destructive",
        title: "Error al cargar entidades",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EntidadFormValues) => {
    try {
      if (editingEntidad) {
        // Actualizar
        const { error } = await supabase
          .from("entidades_educativas")
          .update({
            nombre: data.nombre,
            direccion: data.direccion || null,
            telefono: data.telefono || null,
            email: data.email || null,
            website: data.website || null,
            tipo: data.tipo,
            ciudad: data.ciudad || null,
            pais: data.pais || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEntidad.id);

        if (error) throw error;
        toast({
          title: "Entidad actualizada",
          description: "La entidad educativa ha sido actualizada correctamente.",
        });
      } else {
        // Crear nueva
        const { error } = await supabase
          .from("entidades_educativas")
          .insert({
            nombre: data.nombre,
            direccion: data.direccion || null,
            telefono: data.telefono || null,
            email: data.email || null,
            website: data.website || null,
            tipo: data.tipo,
            ciudad: data.ciudad || null,
            pais: data.pais || null,
          });

        if (error) throw error;
        toast({
          title: "Entidad creada",
          description: "La entidad educativa ha sido creada correctamente.",
        });
      }
      
      setOpenDialog(false);
      setEditingEntidad(null);
      form.reset();
      loadEntidades();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.";
      toast({
        variant: "destructive",
        title: "Error al guardar entidad",
        description: errorMessage,
      });
    }
  };

  const handleEdit = (entidad: EntidadEducativa) => {
    setEditingEntidad(entidad);
    setOpenDialog(true);
  };

  const confirmDeleteEntidad = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from("entidades_educativas")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      
      toast({
        title: "Entidad eliminada",
        description: "La entidad educativa ha sido eliminada correctamente.",
      });
      
      loadEntidades();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error. Intenta nuevamente.";
      toast({
        variant: "destructive",
        title: "Error al eliminar entidad",
        description: errorMessage,
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEntidad(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('newEntity')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingEntidad ? t('form.editTitle') : t('form.newTitle')}</DialogTitle>
              <DialogDescription>
                {editingEntidad 
                  ? t('form.editDescription')
                  : t('form.newDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">{t('form.nameLabel')}</Label>
                <Input
                  id="nombre"
                  {...form.register("nombre")}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">{t('form.typeLabel')}</Label>
                <Input
                  id="tipo"
                  {...form.register("tipo")}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">{t('form.cityLabel')}</Label>
                  <Input
                    id="ciudad"
                    placeholder={t('form.cityPlaceholder')}
                    {...form.register("ciudad")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pais">{t('form.countryLabel')}</Label>
                  <Input
                    id="pais"
                    placeholder={t('form.countryPlaceholder')}
                    {...form.register("pais")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="direccion">{t('form.addressLabel')}</Label>
                <Input
                  id="direccion"
                  placeholder={t('form.addressPlaceholder')}
                  {...form.register("direccion")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">{t('form.phoneLabel')}</Label>
                <Input
                  id="telefono"
                  placeholder={t('form.phonePlaceholder')}
                  {...form.register("telefono")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('form.emailPlaceholder')}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">{t('form.websiteLabel')}</Label>
                <Input
                  id="website"
                  placeholder={t('form.websitePlaceholder')}
                  {...form.register("website")}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setOpenDialog(false);
                    setEditingEntidad(null);
                  }}
                >
                  {t('form.cancel')}
                </Button>
                <Button type="submit">
                  {editingEntidad ? t('form.update') : t('form.create')}
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
      ) : entidades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="mb-4 text-center text-muted-foreground">
              {t('noEntitiesMessage')}
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addEntity')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entidades.map((entidad) => (
            <Card key={entidad.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-xl">{entidad.nombre}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(entidad)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDeletingId(entidad.id);
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{entidad.tipo}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {entidad.ciudad && entidad.pais && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t('card.location')}</span>
                      <span>{entidad.ciudad}, {entidad.pais}</span>
                    </div>
                  )}
                  {entidad.direccion && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t('card.address')}</span>
                      <span>{entidad.direccion}</span>
                    </div>
                  )}
                  {entidad.telefono && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t('card.phone')}</span>
                      <span>{entidad.telefono}</span>
                    </div>
                  )}
                  {entidad.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t('card.email')}</span>
                      <span>{entidad.email}</span>
                    </div>
                  )}
                  {entidad.website && (
                    <div className="flex justify-between">
                      <span className="font-medium">{t('card.website')}</span>
                      <a 
                        href={entidad.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {entidad.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEntidad}>
              {t('deleteDialog.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 