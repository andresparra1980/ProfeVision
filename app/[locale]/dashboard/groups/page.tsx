"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, TriangleAlert, Archive, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useProfesor } from "@/lib/hooks/useProfesor";
import { Link } from "@/i18n/navigation";
import type { Database } from "@/lib/types/database";


import logger from "@/lib/utils/logger";
import { AuthError } from "@supabase/supabase-js";
import { GroupCard } from "./components/GroupCard";
import { GroupFormModal } from "./components/GroupFormModal";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & {
  materias: {
    id: string;
    nombre: string;
    entidades_educativas: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  estudiantes_count: { count: number } | number;
  entidad_id?: string;
  estado: 'activo' | 'archivado';
};

type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas: EntidadEducativa | null;
};

type GrupoFormValues = {
  nombre: string;
  descripcion?: string;
  entidad_id: string;
  materia_id: string;
  periodo_escolar?: string;
};

export default function GroupsPage() {
  const t = useTranslations('dashboard.groups');
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [entidades, setEntidades] = useState<EntidadEducativa[]>([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [groupNameToConfirmDelete, setGroupNameToConfirmDelete] = useState<string | null>(null);
  const [typedGroupName, setTypedGroupName] = useState("");
  const { profesor, loading: profesorLoading, error: profesorError } = useProfesor();
  const [mostrarArchivados, setMostrarArchivados] = useState(false);


  // Helper function for consistent error logging
  const handleSupabaseError = useCallback((context: string, error: unknown) => {
    const errorObj = error as Error;
    const isSupabaseError = errorObj instanceof AuthError;
    const status = isSupabaseError ? (errorObj as AuthError).status : undefined;

    // Safely access code and details
    let code: string | undefined = undefined;
    let details: string | undefined = undefined;

    if (typeof errorObj === 'object' && errorObj !== null) {
      if ('code' in errorObj) {
        code = String((errorObj as { code?: unknown }).code);
      }
      if ('details' in errorObj) {
        details = String((errorObj as { details?: unknown }).details);
      }
    }

    logger.error(`[GroupsPage] ${context}:`, {
      message: errorObj.message,
      status: status,
      code: code,
      details: details,
      errorObject: errorObj
    });

    toast.error(`${t('error.title')} ${context}`, {
      description: `${t('error.description')}: ${errorObj?.message || t('error.unknown')}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`
    });
  }, [t]);

  const loadGrupos = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadGrupos: professor not ready.', { hasProfesor: !!profesor, profesorLoading, profesorError });
      setLoading(false);
      return;
    }
    
    logger.log('[GroupsPage] Loading grupos for professor:', profesor.id);
    try {
      setLoading(true);
      
      const { data: gruposData, error: gruposError } = await supabase
        .from("grupos")
        .select(`
          *,
          materias!inner (
            id,
            nombre,
            entidades_educativas (
              id,
              nombre
            )
          )
        `)
        .eq("profesor_id", profesor.id)
        .eq("estado", mostrarArchivados ? 'archivado' : 'activo')
        .order("nombre");

      if (gruposError) throw gruposError;
      
      if (!gruposData || gruposData.length === 0) {
        setGrupos([]);
        return;
      }
      
      // Para cada grupo, obtener el conteo de estudiantes
      const gruposConConteo = await Promise.all(
        gruposData.map(async (grupo: Grupo) => {
          const { count, error: countError } = await supabase
            .from('estudiante_grupo')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_id', grupo.id);
          
          if (countError) {
            logger.error(`Error al obtener conteo para grupo ${grupo.id}:`, countError);
            return {
              ...grupo,
              estudiantes_count: 0
            };
          }
          
          return {
            ...grupo,
            estudiantes_count: count || 0
          };
        })
      );
      
      setGrupos(gruposConConteo);
    } catch (error: unknown) {
      handleSupabaseError(t('error.loadingGroups'), error);
    } finally {
      setLoading(false);
    }
  }, [profesor, profesorLoading, profesorError, mostrarArchivados, handleSupabaseError, t]);

  const loadMaterias = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadMaterias: professor not ready.');
      return;
    }

    logger.log('[GroupsPage] Loading materias for profesor:', profesor.id);
    try {
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
      
      // Ensure all materias have consistent data structure with explicit entidad_id
      const processedData = data?.map((materia: Materia) => {
        // Si el objeto ya tiene entidad_id directo, lo usamos
        // Si no, intentamos obtenerlo de la relación entidades_educativas
        const entidad_id = materia.entidad_id || 
                          (materia.entidades_educativas?.id || null);
        
        return {
          ...materia,
          entidad_id: entidad_id
        };
      }) || [];
      
      setMaterias(processedData);
    } catch (error: unknown) {
      handleSupabaseError(t('error.loadingSubjects'), error);
    }
  }, [profesor, profesorLoading, profesorError, handleSupabaseError, t]);

  const loadEntidades = useCallback(async () => {
    if (!profesor || profesorLoading || profesorError) {
      logger.log('[GroupsPage] Skipping loadEntidades: professor not ready.');
      return;
    }

    logger.log('[GroupsPage] Loading entidades for profesor:', profesor.id);
    try {
      // Cargamos todas las entidades disponibles para el profesor
      const { data: entidadesData, error: entidadesError } = await supabase
        .from("entidades_educativas")
        .select("*")
        .eq("profesor_id", profesor.id)
        .order("nombre");
        
      if (entidadesError) throw entidadesError;
      
      logger.log("Entidades totales disponibles:", entidadesData?.length || 0);
      setEntidades(entidadesData || []);
    } catch (error: unknown) {
      handleSupabaseError(t('error.loadingEntities'), error);
    }
  }, [profesor, profesorLoading, profesorError, handleSupabaseError, t]);

  useEffect(() => {
    if (!profesorLoading && profesor && !profesorError) {
      logger.log('[GroupsPage] Professor ready, triggering data load.');
      loadGrupos();
      loadMaterias();
      loadEntidades();
    } else if (profesorLoading) {
      logger.log('[GroupsPage] Waiting for professor data...');
      // setLoading(true);
    } else if (profesorError) {
      logger.error('[GroupsPage] Professor hook reported an error, not loading page data.', profesorError);
      setLoading(false);
    } else if (!profesor && !profesorLoading) {
       logger.log('[GroupsPage] No professor data and not loading, possibly logged out or initial state.');
       setLoading(false);
    }
  }, [profesor, profesorLoading, profesorError, loadGrupos, loadMaterias, loadEntidades]);

  useEffect(() => {
    loadGrupos();
  }, [mostrarArchivados, loadGrupos]);

  // Cleanup DOM when delete dialog closes to prevent pointer-events issues
  useEffect(() => {
    if (!confirmDelete) {
      const cleanupDOM = () => {
        // Remove pointer-events from body and html
        document.body.style.pointerEvents = '';
        document.documentElement.style.pointerEvents = '';
      };

      // Run cleanup after dialog animation completes
      const timeoutId = setTimeout(cleanupDOM, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [confirmDelete]);

  const onSubmit = async (data: GrupoFormValues) => {
    if (!profesor) return;
    logger.log('[GroupsPage] Submitting group form...');
    try {
      if (editingGrupo) {
        // Actualizar
        const { error } = await supabase
          .from("grupos")
          .update({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            materia_id: data.materia_id,
            año_escolar: data.periodo_escolar || null,
            periodo_escolar: data.periodo_escolar || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingGrupo.id);

        if (error) throw error;
        toast.success(t('toast.updateTitle'), {
          description: t('toast.updateDescription'),
        });
      } else {
        // Crear nuevo
        const dataToInsert = {
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          materia_id: data.materia_id,
          profesor_id: profesor.id,
          año_escolar: data.periodo_escolar || null,
          periodo_escolar: data.periodo_escolar || null,
        };
        
        const { error } = await supabase
          .from("grupos")
          .insert(dataToInsert);

        if (error) throw error;
        toast.success(t('toast.createTitle'), {
          description: t('toast.createDescription'),
        });
      }
      
      // Close dialog and reload data
      setOpenDialog(false);
      setEditingGrupo(null);
      await loadGrupos();
    } catch (error: unknown) {
      handleSupabaseError(t('error.savingGroup'), error);
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setOpenDialog(true);
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    // Reset editingGrupo when closing the modal
    if (!open) {
      setEditingGrupo(null);
    }
  };

  const confirmDeleteGrupo = async () => {
    if (!deletingId) return;
    logger.log(`[GroupsPage] Attempting to delete group ID: ${deletingId}`);
    try {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      
      toast.success(t('toast.deleteTitle'), {
        description: t('toast.deleteDescription'),
      });
      
      loadGrupos();
    } catch (error: unknown) {
      handleSupabaseError(t('error.deletingGroup'), error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
      setGroupNameToConfirmDelete(null);
      setTypedGroupName("");
    }
  };

  const toggleArchivarGrupo = async (grupo: Grupo) => {
    logger.log(`[GroupsPage] Toggling archive state for group ID: ${grupo.id} to ${grupo.estado === 'activo' ? 'archivado' : 'activo'}`);
    try {
      const nuevoEstado = grupo.estado === 'activo' ? 'archivado' : 'activo';
      const { error } = await supabase
        .from("grupos")
        .update({ 
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq("id", grupo.id);

      if (error) throw error;
      
      toast.success(
        grupo.estado === 'activo' ? t('toast.archivedTitle') : t('toast.activatedTitle'),
        {
          description: grupo.estado === 'activo' 
            ? t('toast.archivedDescription') 
            : t('toast.activatedDescription'),
        }
      );
      
      loadGrupos();
    } catch (error: unknown) {
      handleSupabaseError(t('error.changingGroupState'), error);
    }
  };

  // Helper function for delete callback
  const handleDeleteGrupo = (grupoId: string, grupoNombre: string) => {
    setDeletingId(grupoId);
    setGroupNameToConfirmDelete(grupoNombre);
    setConfirmDelete(true);
  };



  // 1. Handle Initial Professor Load (only if professor isn't loaded yet)
  if (profesorLoading && !profesor) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. Handle Professor Load Error
  if (profesorError) {
     return (
      <div className="flex h-screen items-center justify-center text-center text-destructive">
        {t('error.professorLoad')}: {profesorError.message}
      </div>
     );
  }

  // 3. Handle Logged Out / No Professor State
  if (!profesor) {
     // This should be hit after SIGNED_OUT and failed refresh
     return (
       <div className="flex h-screen items-center justify-center text-center text-muted-foreground">
         {t('error.professorAuth')}
       </div>
     );
  }

  // 4. Professor is loaded, render the main content
  //    Now, loading only refers to the local loading for groups/materias/etc.
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <div className="text-sm text-muted-foreground">
            {t('description')}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setMostrarArchivados(!mostrarArchivados)}
            className="bg-rose-500 text-primary-foreground hover:bg-rose-600 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90 transition-colors"
          >
            {mostrarArchivados ? (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" /> {t('buttons.showActive')}
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" /> {t('buttons.showArchived')}
              </>
            )}
          </Button>
          <GroupFormModal
            open={openDialog}
            onOpenChangeAction={handleOpenChange}
            editingGrupo={editingGrupo}
            entidades={entidades}
            materias={materias}
            materiasFiltradas={materiasFiltradas}
            onSubmitAction={onSubmit}
            onSetMateriasFiltradasAction={setMateriasFiltradas}
            mostrarArchivados={mostrarArchivados}
          />
        </div>
      </div>

      {/* Content Section - Spinner only depends on local 'loading' now */}
      {loading ? ( // Use the local loading state for the content spinner
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <div className="mb-4 text-center text-muted-foreground">
              {t('noGroupsMessage')}
            </div>
            {materias.length === 0 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t('noSubjectsMessage')}
                <Link href="/dashboard/subjects" className="ml-1 font-medium text-primary hover:underline">
                  {t('goToSubjects')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <GroupCard
              key={grupo.id}
              grupo={grupo}
              onEditAction={handleEdit}
              onToggleArchiveAction={toggleArchivarGrupo}
              onDeleteAction={handleDeleteGrupo}
            />
          ))}
        </div>
      )}

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(isOpen) => {
          setConfirmDelete(isOpen);
          if (!isOpen) {
            setGroupNameToConfirmDelete(null);
            setTypedGroupName("");
          }
        }}
        modal={true}
      >
        <DialogContent
          className="sm:max-w-md border-red-500 dark:border-red-700 shadow-xl rounded-lg bg-card dark:bg-background"
          onCloseAutoFocus={(e) => {
            // Prevent focus trap issues
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 text-2xl font-bold flex items-center">
              <TriangleAlert className="h-7 w-7 mr-2 text-red-600 dark:text-red-400" />
              {t('deleteDialog.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="text-gray-600 dark:text-white">
          <p>
                {t('deleteDialog.mainMessage')} {" "}
                <span className="font-semibold">{groupNameToConfirmDelete || t('deleteDialog.selectedGroup')}</span>.
              </p>
              <p>
                {t('deleteDialog.irreversible')} <span className="font-semibold uppercase">{t('deleteDialog.irreversibleText')}</span> {t('deleteDialog.resultingIn')}:
              </p>
              <ul className="list-disc list-inside ml-4 text-sm mt-2">
                <li>{t('deleteDialog.consequence1')}</li>
                <li>{t('deleteDialog.consequence2')}</li>
                <li>{t('deleteDialog.consequence3')}</li>
                <li>{t('deleteDialog.consequence4')}</li>
              </ul>
              <p className="mt-3">
                {t('deleteDialog.confirmMessage')}
              </p>
              <p className="mt-3">
                {t('deleteDialog.archiveAlternative')} <span className="font-semibold">{t('deleteDialog.archiveText')}</span> {t('deleteDialog.archiveReason')}
              </p>
          </div>
          <div className="grid gap-3 py-3">
            <Label htmlFor="group-confirm-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('deleteDialog.typePrompt')} &quot;<span className="font-semibold text-red-600 dark:text-red-400">{groupNameToConfirmDelete}</span>&quot; {t('deleteDialog.typeConfirm')}:
            </Label>
            <Input
              id="group-confirm-name"
              value={typedGroupName}
              onChange={(e) => setTypedGroupName(e.target.value)}
              placeholder={t('deleteDialog.placeholder')}
              className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDelete(false);
                setGroupNameToConfirmDelete(null);
                setTypedGroupName("");
              }}
            >
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteGrupo}
              disabled={typedGroupName !== groupNameToConfirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 