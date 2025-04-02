import { createClient } from '@/lib/supabase/server';

// Obtener el usuario autenticado actual
export const getAuthUser = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    return null;
  }
  
  return data.session.user;
};

// Verificar si un usuario tiene acceso a un recurso específico
export const checkResourceAccess = async (resourceType: string, resourceId: string) => {
  const user = await getAuthUser();
  
  if (!user) {
    return false;
  }
  
  const supabase = createClient();
  
  // Dependiendo del tipo de recurso, verificar el acceso
  switch (resourceType) {
    case 'exam':
    case 'examen':
      const { data: examData } = await supabase
        .from('examenes')
        .select('id')
        .eq('id', resourceId)
        .eq('profesor_id', user.id)
        .single();
      return !!examData;
      
    case 'group':
    case 'grupo':
      const { data: groupData } = await supabase
        .from('grupos')
        .select('id')
        .eq('id', resourceId)
        .eq('profesor_id', user.id)
        .single();
      return !!groupData;
      
    default:
      return false;
  }
}; 