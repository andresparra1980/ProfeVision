-- Función para crear automáticamente un registro de profesor cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profesores (id, nombre_completo, telefono)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data->>'nombre') || ' ' || (NEW.raw_user_meta_data->>'apellido'),
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar y crear profesores para usuarios existentes que no tengan registro
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profesores WHERE id = auth.users.id
    )
  LOOP
    INSERT INTO public.profesores (id, nombre_completo)
    VALUES (
      user_record.id, 
      COALESCE(
        (user_record.raw_user_meta_data->>'nombre') || ' ' || (user_record.raw_user_meta_data->>'apellido'),
        user_record.email
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql; 