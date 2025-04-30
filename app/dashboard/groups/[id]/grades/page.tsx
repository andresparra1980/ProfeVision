'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { GradesTable } from '@/components/grades/grades-table';
import { useToast } from '@/components/ui/use-toast';
import { ComponenteCalificacion, Estudiante, Periodo, EsquemaCalificacion } from '@/lib/types/database';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradesExcelModal } from '@/components/grades/grades-excel-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface GradesPageProps {
  params: Promise<{ id: string }>;
}

interface Calificaciones {
  porComponente: Record<string, Record<string, number>>;
}

interface Materia {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  entidad?: {
    nombre: string;
    id?: string;
  } | null;
}

export default function GradesPage({ params }: GradesPageProps) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [esquema, setEsquema] = useState<EsquemaCalificacion | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [componentes, setComponentes] = useState<ComponenteCalificacion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [componentesBloqueados, setComponentesBloqueados] = useState<Record<string, boolean>>({});
  // Nuevo estado para componentes vinculados a exámenes
  const [componentesVinculados, setComponentesVinculados] = useState<Record<string, { examen_id: string, titulo: string }>>({});
  const [calificaciones, setCalificaciones] = useState<Calificaciones>({
    porComponente: {}
  });
  const [groupName, setGroupName] = useState<string>('');
  const [institucionName, setInstitucionName] = useState<string>('');
  const [periodoEscolar, setPeriodoEscolar] = useState<string | null>(null);
  // Estado para modal de importar/exportar calificaciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponenteCalificacion | null>(null);
  const [modalMode, setModalMode] = useState<'import' | 'export' | 'export-period' | 'export-final'>('export');
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [materia, setMateria] = useState<Materia | null>(null);

  useEffect(() => {
    if (!groupId) return;

    loadData();
    loadGroupName();

    // Define payload type for the subscription
    interface CalificacionPayload {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new?: {
        estudiante_id: string;
        componente_id: string;
        valor: number;
      };
      old?: {
        estudiante_id: string;
        componente_id: string;
      };
    }

    // Suscribirse a cambios en calificaciones
    const calificacionesSubscription = supabase
      .channel('calificaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calificaciones'
        },
        (payload: CalificacionPayload) => {
          if (payload.eventType === 'DELETE') {
            // Eliminar calificación
            setCalificaciones(prev => {
              const newState = { ...prev };
              const oldRecord = payload.old;
              if (oldRecord && newState.porComponente[oldRecord.estudiante_id]) {
                delete newState.porComponente[oldRecord.estudiante_id][oldRecord.componente_id];
              }
              return newState;
            });
          } else {
            // Insertar o actualizar calificación
            const record = payload.new;
            if (record) {
              setCalificaciones(prev => ({
                ...prev,
                porComponente: {
                  ...prev.porComponente,
                  [record.estudiante_id]: {
                    ...prev.porComponente[record.estudiante_id],
                    [record.componente_id]: record.valor
                  }
                }
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      calificacionesSubscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadGroupName = async () => {
    try {
      const { data: grupo, error: grupoError } = await supabase
        .from('grupos')
        .select('nombre, periodo_escolar')
        .eq('id', groupId)
        .single();

      if (grupoError) throw grupoError;
      if (grupo) {
        setGroupName(grupo.nombre);
        setPeriodoEscolar(grupo.periodo_escolar);
      }
    } catch (error) {
      console.error('Error al cargar nombre del grupo:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información del grupo, materia y entidad educativa
      const { data: grupo, error: grupoError } = await supabase
        .from('grupos')
        .select(`
          *,
          materia:materias (
            *,
            entidad:entidades_educativas (
              nombre
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (grupoError) throw grupoError;
      
      setGroupName(grupo.nombre);
      // Handle the case where materia might be null
      if (grupo.materia) {
        setMateria(grupo.materia);
      }
      setInstitucionName(grupo.materia?.entidad?.nombre || 'INSTITUCIÓN EDUCATIVA');

      // Cargar esquema de calificación
      const { data: esquemas, error: esquemasError } = await supabase
        .from('esquemas_calificacion')
        .select('*')
        .eq('grupo_id', groupId);

      if (esquemasError) {
        console.error('Error al cargar esquema:', esquemasError);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el esquema de calificación.',
        });
        return;
      }

      // Si no hay esquema o hay más de uno (no debería ocurrir), redirigir a la página de creación
      if (!esquemas || esquemas.length === 0) {
        toast({
          title: 'No hay esquema de calificación',
          description: 'Primero debes crear un esquema de calificación para este grupo.',
        });
        router.push(`/dashboard/groups/${groupId}/grading-scheme`);
        return;
      }

      // Tomar el primer esquema (debería ser el único)
      const esquema = esquemas[0];
      setEsquema(esquema);

      // Cargar periodos
      const { data: periodos, error: periodosError } = await supabase
        .from('periodos_calificacion')
        .select('*')
        .eq('esquema_id', esquema.id)
        .order('created_at');

      if (periodosError) throw periodosError;
      setPeriodos(periodos);

      // Cargar componentes usando los IDs de los periodos
      if (periodos && periodos.length > 0) {
        const { data: componentes, error: componentesError } = await supabase
          .from('componentes_calificacion')
          .select('*')
          .in('periodo_id', periodos.map((p: Periodo) => p.id))
          .order('created_at');

        if (componentesError) throw componentesError;
        setComponentes(componentes);

        // Inicializar todos los componentes como bloqueados
        const bloqueados: Record<string, boolean> = {};
        componentes.forEach((c: ComponenteCalificacion) => {
          bloqueados[c.id] = true;
        });
        setComponentesBloqueados(bloqueados);

        // Cargar vínculos de componentes con exámenes
        const { data: vinculos, error: vinculosError } = await supabase
          .from('examenes_a_componentes_calificacion')
          .select(`
            examen_id,
            componente_id,
            examen:examen_id(titulo)
          `)
          .in('componente_id', componentes.map((c: ComponenteCalificacion) => c.id));
        
        if (vinculosError) throw vinculosError;
        
        // Transformar los vínculos en un objeto indexado por componente_id
        const vinculosMap: Record<string, { examen_id: string, titulo: string }> = {};
        
        interface VinculoItem {
          componente_id: string;
          examen_id: string;
          examen?: {
            titulo?: string;
          };
        }
        
        vinculos?.forEach((vinculo: VinculoItem) => {
          vinculosMap[vinculo.componente_id] = { 
            examen_id: vinculo.examen_id,
            titulo: vinculo.examen?.titulo || 'Examen sin título'
          };
        });
        
        setComponentesVinculados(vinculosMap);

        // Cargar estudiantes antes de las calificaciones
        const { data: estudiantes, error: estudiantesError } = await supabase
          .from('estudiantes')
          .select('*')
          .in('id', (
            await supabase
              .from('estudiante_grupo')
              .select('estudiante_id')
              .eq('grupo_id', groupId)
          ).data?.map((row: { estudiante_id: string }) => row.estudiante_id) || []
          )
          .order('apellidos', { ascending: true })
          .order('nombres', { ascending: true });

        if (estudiantesError) throw estudiantesError;
        setEstudiantes(estudiantes || []);

        // Cargar calificaciones después de tener los estudiantes
        const { data: calificaciones, error: calificacionesError } = await supabase
          .from('calificaciones')
          .select('*')
          .in('componente_id', componentes.map((c: ComponenteCalificacion) => c.id))
          .in('estudiante_id', estudiantes?.map((e: Estudiante) => e.id) || []);

        if (calificacionesError) throw calificacionesError;
        
        // Transformar las calificaciones en un objeto indexado por estudiante_id y componente_id
        const calificacionesMap = {
          porComponente: {} as Record<string, Record<string, number>>
        };
        
        interface CalificacionItem {
          estudiante_id: string;
          componente_id: string;
          valor: number;
        }
        
        calificaciones?.forEach((cal: CalificacionItem) => {
          if (!calificacionesMap.porComponente[cal.estudiante_id]) {
            calificacionesMap.porComponente[cal.estudiante_id] = {};
          }
          calificacionesMap.porComponente[cal.estudiante_id][cal.componente_id] = cal.valor;
        });
        
        setCalificaciones(calificacionesMap);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los datos. Por favor, intenta nuevamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = async (estudianteId: string, componenteId: string, value: number | null) => {
    if (!esquema) return;
    
    // Verificar si el componente está bloqueado
    if (componentesBloqueados[componenteId]) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Esta calificación está bloqueada para edición.',
      });
      return;
    }

    // Verificar si el componente está vinculado a un examen
    if (componentesVinculados[componenteId]) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Esta calificación está vinculada al examen "${componentesVinculados[componenteId].titulo}" y no puede ser modificada manualmente.`,
      });
      return;
    }

    try {
      if (value === null) {
        // Eliminar calificación
        await supabase
          .from('calificaciones')
          .delete()
          .eq('estudiante_id', estudianteId)
          .eq('componente_id', componenteId);

        // Actualizar estado local
        setCalificaciones(prev => {
          const newState = { ...prev };
          if (newState.porComponente[estudianteId]) {
            delete newState.porComponente[estudianteId][componenteId];
          }
          return newState;
        });
      } else {
        // Verificar si ya existe
        const { data: existente } = await supabase
          .from('calificaciones')
          .select('id')
          .eq('estudiante_id', estudianteId)
          .eq('componente_id', componenteId)
          .maybeSingle();
        
        if (existente) {
          // Actualizar calificación existente
          await supabase
            .from('calificaciones')
            .update({ valor: value })
            .eq('id', existente.id);
        } else {
          // Generar UUID
          const uuid = crypto.randomUUID();
          
          // Insertar nueva calificación
          await supabase
            .from('calificaciones')
            .insert({ 
              id: uuid,
              estudiante_id: estudianteId, 
              componente_id: componenteId, 
              valor: value 
            });
        }
        
        // Actualizar estado local
        setCalificaciones(prev => ({
          ...prev,
          porComponente: {
            ...prev.porComponente,
            [estudianteId]: {
              ...prev.porComponente[estudianteId],
              [componenteId]: value
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la calificación. Por favor, intenta nuevamente.',
      });
    }
  };

  const toggleComponenteLock = (componenteId: string) => {
    // No permitir el desbloqueo de componentes vinculados a exámenes
    if (componentesVinculados[componenteId]) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Este componente está vinculado al examen "${componentesVinculados[componenteId].titulo}" y no puede ser desbloqueado.`,
      });
      return;
    }
    
    setComponentesBloqueados(prev => ({
      ...prev,
      [componenteId]: !prev[componenteId]
    }));
  };

  // Funciones para importar/exportar calificaciones
  const handleImportGrades = (componenteId: string) => {
    // No permitir importar calificaciones en componentes vinculados a exámenes
    if (componentesVinculados[componenteId]) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Este componente está vinculado al examen "${componentesVinculados[componenteId].titulo}" y no se pueden importar calificaciones manualmente.`,
      });
      return;
    }
    
    const componente = componentes.find(c => c.id === componenteId);
    if (componente) {
      setSelectedComponent(componente);
      setModalMode('import');
      setIsModalOpen(true);
    }
  };

  const handleExportGrades = (componenteId: string) => {
    const componente = componentes.find(c => c.id === componenteId);
    if (componente) {
      setSelectedComponent(componente);
      setModalMode('export');
      setIsModalOpen(true);
    }
  };

  const handleImportComplete = () => {
    setIsModalOpen(false);
    loadData(); // Recargar datos
  };

  // Función para obtener las calificaciones de un componente específico
  const getComponentGrades = (componenteId: string): Record<string, number> => {
    const grades: Record<string, number> = {};
    Object.entries(calificaciones.porComponente).forEach(([estudianteId, comps]) => {
      if (comps[componenteId] !== undefined) {
        grades[estudianteId] = comps[componenteId];
      }
    });
    return grades;
  };

  const handleExportPeriod = (periodoId: string) => {
    const periodo = periodos.find(p => p.id === periodoId);
    if (periodo) {
      setSelectedPeriodo(periodo);
      setSelectedComponent(null);
      setModalMode('export-period');
      setIsModalOpen(true);
    }
  };

  const handleExportFinal = () => {
    setSelectedComponent(null);
    setModalMode('export-final');
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col space-y-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/dashboard/groups")}
          className="mb-0 w-fit"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Grupos
        </Button>
        
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight">Calificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {institucionName} / {materia?.nombre || 'Materia'} / Grupo {groupName}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <GradesTable
          estudiantes={estudiantes}
          periodos={periodos}
          componentes={componentes}
          calificaciones={calificaciones}
          onGradeChange={handleGradeChange}
          componentesBloqueados={componentesBloqueados}
          onToggleLock={toggleComponenteLock}
          onImportGrades={handleImportGrades}
          onExportGrades={handleExportGrades}
          onExportPeriod={handleExportPeriod}
          onExportFinal={handleExportFinal}
          componentesVinculados={componentesVinculados}
        />
      </div>

      {/* Modal para importar/exportar calificaciones */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} modal={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'import' ? 'Importar' : 'Exportar'} Calificaciones
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'import' 
                ? 'Importa calificaciones desde un archivo Excel' 
                : modalMode === 'export-period'
                ? `Exportar calificaciones del ${selectedPeriodo?.nombre}`
                : modalMode === 'export-final'
                ? 'Exportar todas las calificaciones y nota final'
                : 'Exporta calificaciones a un archivo Excel'}
            </DialogDescription>
          </DialogHeader>
          <GradesExcelModal
            estudiantes={estudiantes}
            componente={selectedComponent}
            calificaciones={modalMode === 'import' || modalMode === 'export' 
              ? getComponentGrades(selectedComponent?.id || '')
              : getComponentGrades(selectedComponent?.id || '')}
            onImportComplete={handleImportComplete}
            mode={modalMode}
            materia={materia ? materia : { id: '', nombre: 'Sin materia' }}
            grupo={{
              id: groupId,
              nombre: groupName,
              periodo_escolar: periodoEscolar
            }}
            periodoActual={selectedPeriodo}
            componentesPeriodo={modalMode === 'export-period' 
              ? componentes.filter(c => c.periodo_id === selectedPeriodo?.id) 
              : null}
            todosComponentes={modalMode === 'export-final' ? componentes : null}
            todasCalificaciones={calificaciones.porComponente}
            periodos={periodos}
            componentes={componentes}
            institucionName={institucionName}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 