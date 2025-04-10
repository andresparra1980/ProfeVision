import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';
import { Session } from '@supabase/supabase-js';

export type Profesor = Database['public']['Tables']['profesores']['Row'] & {
  telefono?: string | null;
  cargo?: string | null;
  biografia?: string | null;
};

export type ProfesorUpdate = Database['public']['Tables']['profesores']['Update'] & {
  telefono?: string | null;
  cargo?: string | null;
  biografia?: string | null;
};

export function useProfesor() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProfesor = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          setProfesor(null);
          return;
        }

        const { data: profesorData, error: profesorError } = await supabase
          .from('profesores')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profesorError) throw profesorError;
        setProfesor(profesorData);
      } catch (err: unknown) {
        console.error('Error al cargar profesor:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadProfesor();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setProfesor(null);
        } else if (session) {
          const { data: profesorData, error: profesorError } = await supabase
            .from('profesores')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profesorError) {
            console.error('Error al cargar profesor:', profesorError);
            setError(profesorError);
            return;
          }

          setProfesor(profesorData);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateProfesor = async (updates: ProfesorUpdate) => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('No hay sesión activa');
      }
      
      const { data, error } = await supabase
        .from('profesores')
        .update(updates)
        .eq('id', session.session.user.id)
        .select('*')
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfesor(data);
      return { success: true, data };
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Error desconocido'));
      console.error('Error actualizando profesor:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  return {
    profesor,
    loading,
    error,
    updateProfesor,
  };
} 