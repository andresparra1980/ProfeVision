'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GradingSchemeEditor } from '@/components/grading/grading-scheme-editor';
import { supabase } from '@/lib/supabase/client';
import type { GradingScheme } from '@/lib/types/grading';
import type { Database } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Prefijo _ para indicar que no se utiliza
type _EsquemaCalificacion = Database['public']['Tables']['esquemas_calificacion']['Row'] & {
  periodos: Array<
    Database['public']['Tables']['periodos_calificacion']['Row'] & {
      componentes: Array<Database['public']['Tables']['componentes_calificacion']['Row']>
    }
  >
};

// Definir interfaces para los tipos específicos
interface PeriodoCalificacion {
  id: string;
  nombre: string;
  porcentaje: number;
  orden: number;
  esquema_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  componentes: ComponenteCalificacion[];
}

interface ComponenteCalificacion {
  id: string;
  nombre: string;
  porcentaje: number;
  periodo_id: string;
  tipo: string;
}

export default function GradingSchemePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('dashboard.groups.gradingScheme');
  const groupId = params.id as string;
  const [initialScheme, setInitialScheme] = useState<GradingScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string>('');
  const [materia, setMateria] = useState<string>('');
  const [institucion, setInstitucion] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar información completa del grupo, incluyendo materia e institución
        const { data: grupo, error: grupoError } = await supabase
          .from('grupos')
          .select(`
            nombre,
            materia:materias (
              nombre,
              entidad:entidades_educativas (
                nombre
              )
            )
          `)
          .eq('id', groupId)
          .single();

        if (grupoError) throw grupoError;
        
        if (grupo) {
          setGroupName(grupo.nombre);
          if (grupo.materia) {
            setMateria(grupo.materia.nombre || '');
            setInstitucion(grupo.materia.entidad?.nombre || t('defaultInstitution'));
          }
        }

        // Primero obtenemos el esquema
        const { data: schemes, error: schemeError } = await supabase
          .from('esquemas_calificacion')
          .select(`
            id,
            grupo_id,
            nombre,
            fecha_inicio,
            fecha_fin,
            periodos:periodos_calificacion(
              id,
              nombre,
              porcentaje,
              orden,
              esquema_id,
              fecha_inicio,
              fecha_fin,
              componentes:componentes_calificacion(
                id,
                nombre,
                porcentaje,
                periodo_id,
                tipo
              )
            )
          `)
          .eq('grupo_id', groupId);

        if (schemeError) throw schemeError;
        
        // Si no hay esquema, retornamos null (esto es válido y esperado)
        if (!schemes || schemes.length === 0) {
          setInitialScheme(null);
          return;
        }

        // Ordenamos los periodos por el campo orden
        const schemeWithSortedPeriods = {
          ...schemes[0],
          periodos: schemes[0].periodos
            ? schemes[0].periodos
                .sort((a: PeriodoCalificacion, b: PeriodoCalificacion) => a.orden - b.orden)
                .map((periodo: PeriodoCalificacion) => ({
                  ...periodo,
                  componentes: periodo.componentes || []
                }))
            : []
        } as GradingScheme;

        setInitialScheme(schemeWithSortedPeriods);
      } catch (error) {
        console.error(t('error.loadingData'), error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, t]);

  const handleSave = async (scheme: GradingScheme) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/grading-scheme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheme),
      });

      if (!response.ok) {
        throw new Error(t('error.savingScheme'));
      }

      const updatedScheme = await response.json();
      setInitialScheme(updatedScheme as GradingScheme);

      toast({
        title: t('success.title'),
        description: t('success.schemeSaved'),
      });

      router.push(`/dashboard/groups/${groupId}/grades`);
    } catch (error) {
      console.error('Error:', error);
      throw error; // El componente GradingSchemeEditor manejará este error
    }
  };

  if (loading) {
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
          <ChevronLeft className="mr-2 h-4 w-4" /> {t('backToGroups')}
        </Button>
        
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {institucion} / {materia} / {groupName}
          </p>
        </div>
      </div>

      <div>
        <GradingSchemeEditor
          initialScheme={initialScheme || undefined}
          groupId={groupId}
          onSave={handleSave}
        />
      </div>
    </div>
  );
} 