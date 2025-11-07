"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Folders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TitleCardWithDepth } from "@/components/shared/title-card-with-depth";
import {
  StudentFormModal,
  StudentsTable,
  StudentDetailsDialog,
  EmptyStudentsState
} from "./components";

interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  created_at: string;
}

interface Grupo {
  id: string;
  nombre: string;
  materias: {
    nombre: string;
  };
}

export default function StudentsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.students');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasGroups, setHasGroups] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const checkForGroups = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { error: groupError, count } = await supabase
        .from("grupos")
        .select("*", { count: 'exact' })
        .eq("profesor_id", session.user.id)
        .limit(1);

      if (groupError) {
        toast.error(t('error.title'), {
          description: t('error.verifyGroups'),
        });
        return;
      }

      setHasGroups(count !== null && count > 0);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.verifyGroups'),
      });
    }
  }, [router, t]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Obtener estudiantes que pertenecen a los grupos del profesor
      const { data: estudiantes, error: estudiantesError } = await supabase
        .from('estudiantes')
        .select(`
          id,
          nombres,
          apellidos,
          identificacion,
          email,
          created_at,
          estudiante_grupo!inner(
            grupos!inner(
              profesor_id
            )
          )
        `)
        .eq('estudiante_grupo.grupos.profesor_id', session.user.id)
        .order('apellidos')
        .order('nombres');

      if (estudiantesError) {
        throw estudiantesError;
      }
      
      // Transformar los datos para obtener un formato más fácil de usar
      const uniqueStudents = estudiantes.map((estudiante: Student) => ({
        id: estudiante.id,
        nombres: estudiante.nombres,
        apellidos: estudiante.apellidos,
        identificacion: estudiante.identificacion,
        email: estudiante.email,
        created_at: estudiante.created_at
      }));
      
      setStudents(uniqueStudents);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.loadingStudents'),
      });
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  const loadGrupos = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data, error: gruposError } = await supabase
        .from("grupos")
        .select(`
          id,
          nombre,
          materias (
            nombre
          )
        `)
        .eq("profesor_id", session.user.id)
        .order("nombre");

      if (gruposError) throw gruposError;
      setGrupos(data || []);
    } catch (_error) {
      toast.error(t('error.title'), {
        description: t('error.loadingGroups'),
      });
    }
  }, [t]);

  useEffect(() => {
    checkForGroups();
    fetchStudents();
    loadGrupos();
  }, [checkForGroups, fetchStudents, loadGrupos]);

  const handleViewDetails = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowDetails(true);
  };

  const renderStudentsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      );
    }

    // Show empty states
    if (!hasGroups || students.length === 0) {
      return (
        <EmptyStudentsState
          hasGroups={hasGroups}
          hasStudents={students.length > 0}
          onCreateStudent={() => setIsFormOpen(true)}
          onManageGroups={() => router.push("/dashboard/groups")}
        />
      );
    }

    // Show students table
    return (
      <>
        <StudentsTable
          students={students}
          searchQuery={searchQuery}
          onViewDetails={handleViewDetails}
          loadingDetails={false}
          selectedStudentId={selectedStudentId}
        />
        <StudentDetailsDialog
          open={showDetails}
          onOpenChange={setShowDetails}
          studentId={selectedStudentId}
        />
      </>
    );
  };

  return (
    <div className="space-y-4">
      <TitleCardWithDepth
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              onClick={() => router.push("/dashboard/groups")}
              className="bg-secondary text-primary-foreground dark:bg-secondary dark:text-white transition-colors w-full sm:w-auto"
            >
              <Folders className="mr-2 h-4 w-4" /> {t('actions.manageGroups')}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> {t('actions.createStudent')}
            </Button>
          </div>
        }
      />

      <StudentFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        grupos={grupos}
        onSuccess={fetchStudents}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
          <CardDescription>
            {t('table.description')}
          </CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <Input
              placeholder={t('table.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStudents()}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> {t('table.refreshList')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderStudentsList()}
        </CardContent>
      </Card>
    </div>
  );
} 