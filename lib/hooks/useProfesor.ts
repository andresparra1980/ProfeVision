import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/types/database';

export type Profesor = Database['public']['Tables']['profesores']['Row'];
export type ProfesorUpdate = Database['public']['Tables']['profesores']['Update'];

export function useProfesor() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getProfesor() {
      try {
        setLoading(true);
        
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session) {
          throw new Error('No hay sesión activa');
        }
        
        const { data, error } = await supabase
          .from('profesores')
          .select('*')
          .eq('id', session.session.user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setProfesor(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Error desconocido'));
        console.error('Error obteniendo profesor:', e);
      } finally {
        setLoading(false);
      }
    }
    
    getProfesor();
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