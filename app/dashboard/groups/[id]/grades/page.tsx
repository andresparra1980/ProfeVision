'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { GradesTable } from '@/components/grades/grades-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ComponenteCalificacion, Estudiante, Periodo, EsquemaCalificacion } from '@/lib/types/database';
import { Lock, Unlock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GradesPageProps {
  params: Promise<{ id: string }>;
}

interface Calificaciones {
  porComponente: Record<string, Record<string, number>>;
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
  const [calificaciones, setCalificaciones] = useState<Calificaciones>({
    porComponente: {}
  });
  const [groupName, setGroupName] = useState<string>('');

  useEffect(() => {
    if (!groupId) return;

    loadData();
    loadGroupName();

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
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // Eliminar calificación
            setCalificaciones(prev => {
              const newState = { ...prev };
              const oldRecord = payload.old as any;
              if (newState.porComponente[oldRecord.estudiante_id]) {
                delete newState.porComponente[oldRecord.estudiante_id][oldRecord.componente_id];
              }
              return newState;
            });
          } else {
            // Insertar o actualizar calificación
            const record = payload.new as any;
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
      )
      .subscribe();

    return () => {
      calificacionesSubscription.unsubscribe();
    };
  }, [groupId]);

  const loadGroupName = async () => {
    try {
      const { data: grupo, error: grupoError } = await supabase
        .from('grupos')
        .select('nombre')
        .eq('id', groupId)
        .single();

      if (grupoError) throw grupoError;
      if (grupo) setGroupName(grupo.nombre);
    } catch (error) {
      console.error('Error al cargar nombre del grupo:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
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
          .in('periodo_id', periodos.map(p => p.id))
          .order('created_at');

        if (componentesError) throw componentesError;
        setComponentes(componentes);

        // Inicializar todos los componentes como bloqueados
        const bloqueados: Record<string, boolean> = {};
        componentes.forEach(c => {
          bloqueados[c.id] = true;
        });
        setComponentesBloqueados(bloqueados);

        // Cargar estudiantes antes de las calificaciones
        const { data: estudiantes, error: estudiantesError } = await supabase
          .from('estudiantes')
          .select('*')
          .in('id', (
            await supabase
              .from('estudiante_grupo')
              .select('estudiante_id')
              .eq('grupo_id', groupId)
          ).data?.map(row => row.estudiante_id) || []
          )
          .order('nombre_completo');

        if (estudiantesError) throw estudiantesError;
        setEstudiantes(estudiantes || []);

        // Cargar calificaciones después de tener los estudiantes
        const { data: calificaciones, error: calificacionesError } = await supabase
          .from('calificaciones')
          .select('*')
          .in('componente_id', componentes.map(c => c.id))
          .in('estudiante_id', estudiantes?.map(e => e.id) || []);

        if (calificacionesError) throw calificacionesError;
        
        // Transformar las calificaciones en un objeto indexado por estudiante_id y componente_id
        const calificacionesMap = {
          porComponente: {} as Record<string, Record<string, number>>
        };
        
        calificaciones?.forEach(cal => {
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
        // Generar UUID usando Web Crypto API
        const uuid = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => 
          b.toString(16).padStart(2, '0')
        ).join('');
        const formattedUuid = `${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`;

        // Insertar o actualizar calificación
        const { error } = await supabase
          .from('calificaciones')
          .upsert(
            {
              id: formattedUuid,
              estudiante_id: estudianteId,
              componente_id: componenteId,
              valor: value,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'estudiante_id,componente_id'
            }
          );

        if (error) {
          throw error;
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
    setComponentesBloqueados(prev => ({
      ...prev,
      [componenteId]: !prev[componenteId]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/dashboard/groups")}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Grupos
        </Button>
        <nav className="flex text-sm text-muted-foreground">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard/groups" className="hover:text-foreground">
                Grupos
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium">
              {groupName}
            </li>
            <li>/</li>
            <li className="text-foreground font-medium">
              Calificaciones
            </li>
          </ol>
        </nav>
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
        />
      </div>
    </div>
  );
} 