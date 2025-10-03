import React from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export type Materia = {
  id: string;
  nombre: string;
  entidades_educativas?: { nombre: string } | null;
};

export type Grupo = {
  id: string;
  nombre: string;
  materia_id: string;
  estado: "activo" | "archivado";
};

export type EditingExam = {
  id: string;
  titulo: string;
  materia_id?: string | null;
  duracion_minutos?: number | null;
  puntaje_total?: number | null;
};

/**
 * Hook to load materias and grupos for the current profesor
 */
export function useExamDraft(profesorId: string | undefined) {
  const { toast } = useToast();
  const [materias, setMaterias] = React.useState<Materia[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [editingExam, setEditingExam] = React.useState<EditingExam | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!profesorId) return;
      try {
        const { data: materiasData } = await supabase
          .from("materias")
          .select("id,nombre,entidades_educativas(nombre)")
          .eq("profesor_id", profesorId)
          .order("nombre");
        setMaterias(materiasData || []);

        const { data: gruposData } = await supabase
          .from("grupos")
          .select("*")
          .eq("profesor_id", profesorId)
          .eq("estado", "activo")
          .order("nombre");
        setGrupos(gruposData || []);
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar materias y grupos",
        });
      }
    };
    load();
  }, [profesorId, toast]);

  return { materias, grupos, editingExam, setEditingExam };
}
