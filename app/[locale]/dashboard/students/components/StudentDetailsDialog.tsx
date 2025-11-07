"use client";

import { useState, useEffect } from "react";
import { School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "next-intl";

interface StudentDetails {
  id: string;
  grupos: Array<{
    id: string;
    nombre: string;
    materia: {
      nombre: string;
    };
  }>;
}

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

export function StudentDetailsDialog({ open, onOpenChange, studentId }: StudentDetailsDialogProps) {
  const t = useTranslations('dashboard.students');
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetails(studentId);
    }
  }, [open, studentId]);

  async function fetchStudentDetails(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("estudiante_grupo")
        .select(`
          grupo_id,
          grupos (
            id,
            nombre,
            materias (
              nombre
            )
          )
        `)
        .eq("estudiante_id", id);

      if (error) throw error;

      if (data) {
        const grupos = data.map((item: {
          grupos: {
            id: string;
            nombre: string;
            materias: {
              nombre: string;
            }
          }
        }) => ({
          id: item.grupos.id,
          nombre: item.grupos.nombre,
          materia: {
            nombre: item.grupos.materias.nombre
          }
        }));

        setStudent({
          id: id,
          grupos: grupos
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error("Error", {
        description: err.message || "No se pudo cargar la información del estudiante",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="bg-[#FAFAF4] dark:bg-[#171717]">
        <DialogHeader>
          <DialogTitle>{t('details.title')}</DialogTitle>
          <DialogDescription>
            {t('details.description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {student?.grupos.map((grupo) => (
              <div key={grupo.id} className="flex items-start space-x-2 p-4 rounded-lg border">
                <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">{grupo.nombre}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('details.subject')}: {grupo.materia.nombre}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('details.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
