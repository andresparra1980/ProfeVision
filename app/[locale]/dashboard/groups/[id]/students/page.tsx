"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Plus, Search, X, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ExcelImport } from "@/components/students/excel-import";
import { use } from "react";

interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  estudiante_id?: string;
}

interface GroupData {
  id: string;
  nombre: string;
  materias?: {
    nombre: string;
  };
  periodo_escolar?: string;
  año_escolar?: string;
}

interface EstudianteGrupoRecord {
  id: string;
  estudiante_id: string;
  estudiantes: {
    nombres: string;
    apellidos: string;
    identificacion: string;
    email: string;
  };
}

// Componente principal que maneja los params y usa React.use()
export default function GroupStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  // Usando React.use() para desenvolver la promesa de params
  const resolvedParams = use(params);
  return <GroupStudentsContent groupId={resolvedParams.id} />;
}

// Componente interno que contiene toda la lógica
function GroupStudentsContent({ groupId }: { groupId: string }) {
  const router = useRouter();
  const t = useTranslations('dashboard.groups.students');
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Callback functions
  const fetchGroupDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("grupos")
        .select("*, materias(nombre)")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error: unknown) {
      console.error("Error fetching group details:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.loadingGroup');
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: "destructive",
      });
      router.push("/dashboard/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, router, t]);

  const fetchGroupStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("estudiante_grupo")
        .select("*, estudiantes(*)")
        .eq("grupo_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Format data to display student information directly
      const formattedData = data.map((item: EstudianteGrupoRecord) => ({
        id: item.id,
        estudiante_id: item.estudiante_id,
        nombres: item.estudiantes.nombres,
        apellidos: item.estudiantes.apellidos,
        identificacion: item.estudiantes.identificacion,
        email: item.estudiantes.email,
      }));
      
      setGroupStudents(formattedData);
    } catch (error: unknown) {
      console.error("Error fetching group students:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.loadingStudents');
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [groupId, t]);

  const searchStudents = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .or(`nombres.ilike.%${searchQuery}%,apellidos.ilike.%${searchQuery}%,identificacion.ilike.%${searchQuery}%`)
        .order("apellidos", { ascending: true })
        .order("nombres", { ascending: true })
        .limit(10);

      if (error) throw error;
      
      // Filter students that are already in the group
      const studentIds = groupStudents.map(s => s.estudiante_id);
      const filteredResults = data.filter((student: Student) => !studentIds.includes(student.id));
      
      setSearchResults(filteredResults);
    } catch (error: unknown) {
      console.error("Error searching students:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.searchingStudents');
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, groupStudents, t]);

  const handleImportComplete = useCallback(() => {
    toast({
      title: t('success.title'),
      description: t('success.importComplete'),
      variant: "default",
    });
    
    fetchGroupStudents();
  }, [fetchGroupStudents, t]);

  const addStudentToGroup = useCallback(async (student: Student) => {
    setIsAdding(true);

    try {
      const { error } = await supabase.rpc('crear_estudiante_en_grupo', {
        p_nombres: student.nombres,
        p_apellidos: student.apellidos,
        p_identificacion: student.identificacion,
        p_email: student.email,
        p_grupo_id: groupId
      });

      if (error) throw error;

      // Refresh the list
      fetchGroupStudents();
      setSearchQuery("");
      setSearchResults([]);
      
      toast({
        title: t('success.studentAdded'),
        description: t('success.studentAddedDescription'),
      });
    } catch (error: unknown) {
      console.error("Error adding student to group:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.addingStudent');
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  }, [groupId, fetchGroupStudents, t]);

  const removeStudentFromGroup = useCallback(async (studentId: string) => {
    try {
      const { error } = await supabase
        .from("estudiante_grupo")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      // Refresh the list
      fetchGroupStudents();
      
      toast({
        title: t('success.studentRemoved'),
        description: t('success.studentRemovedDescription'),
      });
    } catch (error: unknown) {
      console.error("Error removing student from group:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.removingStudent');
      toast({
        title: t('error.title'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [fetchGroupStudents, t]);

  // Effects
  useEffect(() => {
    fetchGroupDetails();
    fetchGroupStudents();
  }, [fetchGroupDetails, fetchGroupStudents]);

  // Conditional rendering
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-8">
        <p>{t('error.groupNotFound')}</p>
        <Button 
          className="mt-4"
          onClick={() => router.push("/dashboard/groups")}
        >
          {t('backToGroups')}
        </Button>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/dashboard/groups")}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> {t('backToGroups')}
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{group.nombre}</h2>
        <p className="text-muted-foreground">
          {group.materias?.nombre} | {group.periodo_escolar || group.año_escolar || t('noSchoolPeriod')}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('groupStudents')}</CardTitle>
            <CardDescription>
              {groupStudents.length} {t('studentsRegistered')}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen} modal={true}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('importFromExcel')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>{t('importExcelTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('importExcelDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <ExcelImport onImportComplete={handleImportComplete} groupId={groupId} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t('addStudent')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('searchStudent')}</DialogTitle>
                  <DialogDescription>
                    {t('searchStudentDescription')}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => searchStudents()}
                      disabled={isSearching}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <p className="font-medium">{student.nombres} {student.apellidos}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.identificacion}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addStudentToGroup(student)}
                            disabled={isAdding}
                          >
                            {t('add')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('noStudentsFound')}
                    </p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.identification')}</TableHead>
                    <TableHead>{t('table.names')}</TableHead>
                    <TableHead>{t('table.surnames')}</TableHead>
                    <TableHead>{t('table.email')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.identificacion}</TableCell>
                      <TableCell>{student.nombres}</TableCell>
                      <TableCell>{student.apellidos}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStudentFromGroup(student.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 