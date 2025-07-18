"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { useProfesor } from "@/lib/hooks/useProfesor";
import type { Database } from "@/lib/types/database";
import { SubjectCard } from "./components/SubjectCard";
import { SubjectFormModal } from "./components/SubjectFormModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";

type Materia = Database["public"]["Tables"]["materias"]["Row"];
type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

export default function SubjectsPage() {
  const t = useTranslations('dashboard.subjects');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [deletingMateria, setDeletingMateria] = useState<Materia | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { profesor } = useProfesor();

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

  const handleSubmit = async (data: { nombre: string; descripcion?: string; entidad_id?: string }) => {
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
          title: t('toast.createTitle'),
          description: t('toast.createDescription'),
        });
      }
      
      setOpenDialog(false);
      setEditingMateria(null);
      loadMaterias();
    } catch (error: unknown) {
      handleSupabaseError(t('toast.saveError'), error);
    }
  };

  const handleEdit = (materia: Materia) => {
    setEditingMateria(materia);
    setOpenDialog(true);
  };

  const handleDelete = (materia: Materia) => {
    setDeletingMateria(materia);
    setConfirmDelete(true);
  };

  const confirmDeleteMateria = async () => {
    if (!deletingMateria) return;
    logger.log(`[SubjectsPage] Attempting to delete subject ID: ${deletingMateria.id}`);
    try {
      const { error } = await supabase
        .from("materias")
        .delete()
        .eq("id", deletingMateria.id);

      if (error) throw error;
      
      toast({
        title: t('toast.deleteTitle'),
        description: t('toast.deleteDescription'),
      });
      
      loadMaterias();
    } catch (error: unknown) {
      handleSupabaseError('al eliminar materia', error);
    } finally {
      setDeletingMateria(null);
      setConfirmDelete(false);
    }
  };

  const handleCancel = () => {
    setEditingMateria(null);
    setOpenDialog(false);
  };

  const handleCancelDelete = () => {
    setDeletingMateria(null);
    setConfirmDelete(false);
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
        <SubjectFormModal
          open={openDialog}
          onOpenChange={setOpenDialog}
          editingMateria={editingMateria}
          entidades={entidades}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : materias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <p className="mb-4 text-center text-muted-foreground">
              {t('noSubjectsMessage')}
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('addSubject')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <SubjectCard
              key={materia.id}
              materia={materia}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <DeleteConfirmationModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        subjectName={deletingMateria?.nombre || null}
        onConfirm={confirmDeleteMateria}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}