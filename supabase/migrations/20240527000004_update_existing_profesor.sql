-- Actualizar el nombre_completo de los profesores existentes para mejorar su formato
UPDATE public.profesores
SET nombre_completo = INITCAP(REPLACE(REPLACE(SPLIT_PART(nombre_completo, '@', 1), '.', ' '), '-', ' '))
WHERE nombre_completo LIKE '%@%'; 