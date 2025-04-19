import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/types/database';
import { Session, AuthError } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/components/ui/use-toast';

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
  const [error, setError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    const loadProfesor = async () => {
      setLoading(true);
      logger.log('[useProfesor] Attempting initial load...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
           logger.error('[useProfesor] Initial getSession error:', sessionError);
           throw sessionError;
        }
        if (!session) {
          logger.log('[useProfesor] No initial session found.');
          setProfesor(null);
          setLoading(false);
          return;
        }
        
        logger.log('[useProfesor] Initial session found, fetching professor data for user:', session.user.id);
        const { data: profesorData, error: profesorError } = await supabase
          .from('profesores')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profesorError) {
          logger.error('[useProfesor] Error fetching initial professor data:', profesorError);
          throw profesorError;
        }
        logger.log('[useProfesor] Initial professor data fetched successfully.');
        setProfesor(profesorData);
      } catch (err: unknown) {
        const errorObj = err as Error;
        const status = errorObj instanceof AuthError ? errorObj.status : undefined;
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
        
        logger.error('[useProfesor] Error during initial load:', { 
          message: errorObj.message, 
          status: status,
          code: code, 
          details: details,
          errorObject: errorObj 
        });
        setError(errorObj instanceof AuthError ? errorObj : errorObj);
      } finally {
        setLoading(false);
      }
    };

    loadProfesor();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        logger.log(`[useProfesor] onAuthStateChange event: ${event}`, { hasSession: !!session });
        
        if (event === 'SIGNED_OUT') {
          logger.log('[useProfesor] SIGNED_OUT detected, clearing professor data.');
          setProfesor(null);
          setError(null);
          setLoading(false);
        } else if (session) {
          logger.log('[useProfesor] Session found in onAuthStateChange, fetching/re-fetching professor data for user:', session.user.id);
          setLoading(true);
          try {
            const { data: profesorData, error: profesorError } = await supabase
              .from('profesores')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profesorError) {
              logger.error('[useProfesor] Error fetching professor data in onAuthStateChange:', profesorError);
              throw profesorError;
            }
            logger.log('[useProfesor] Professor data fetched successfully in onAuthStateChange.');
            setProfesor(profesorData);
            setError(null);
          } catch (err: unknown) {
            const errorObj = err as Error;
            const status = errorObj instanceof AuthError ? errorObj.status : undefined;
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

            logger.error('[useProfesor] Error during onAuthStateChange fetch:', {
               message: errorObj.message, 
               status: status,
               code: code,
               details: details,
               errorObject: errorObj 
            });
            setError(errorObj instanceof AuthError ? errorObj : errorObj);
            setProfesor(null);
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      logger.log('[useProfesor] Unsubscribing auth listener.');
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
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido actualizados.' });
      return { success: true, data };
    } catch (error: unknown) {
      const isAuthError = error instanceof AuthError;
      const errorObj = error as Error;
      const status = isAuthError ? (error as AuthError).status : undefined;
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

      logger.error('[useProfesor] Error updating profesor data:', {
        message: errorObj.message,
        status: status,
        code: code,
        details: details,
        errorObject: errorObj,
      });

      setError(errorObj);

      toast({
        title: 'Error al actualizar',
        description: `Error ${status ? `(${status}) ` : ''}: ${errorObj.message}`,
        variant: 'destructive',
      });

      return { success: false, error: errorObj };
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