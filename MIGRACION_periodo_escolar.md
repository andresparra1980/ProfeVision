# Plan de Migración de `año_escolar` a `periodo_escolar`

## Problema identificado

Se ha detectado un problema potencial en el uso del carácter `ñ` en el nombre de la columna `año_escolar` en la tabla `grupos`. Los caracteres especiales en nombres de columnas pueden causar:

1. Problemas de compatibilidad con algunas herramientas y sistemas
2. Mayor propensión a errores de escritura en el código
3. Posibles problemas con ciertas consultas SQL
4. Desviación de las buenas prácticas (usar solo caracteres ASCII: a-z, 0-9, _)

Además, el término "Periodo Escolar" representa mejor el concepto, ya que puede incluir semestres (ej: 1S-2025, 2S-2025) y no solo años.

## Plan de migración revisado

### Fase 1: Compatibilidad inmediata (Implementado)

- [x] Actualizar la interfaz de usuario para mostrar "Periodo Escolar" en lugar de "Año escolar"
- [x] Actualizar el placeholder para mostrar el nuevo formato (Ej: 2025 o 2S-2025)
- [x] Actualizar los tipos TypeScript para soportar ambos campos durante la transición

### Fase 2: Adaptación del código para usar ambas columnas (Implementado)

- [x] Modificar el código para guardar datos en ambas columnas (`año_escolar` y `periodo_escolar`)
- [x] Utilizar lógica de fallback para leer primero `periodo_escolar` y si no existe usar `año_escolar`
- [x] Preparar script de migración para futuro uso

### Fase 3: Migración de datos (Pendiente)

- [ ] Añadir columna `periodo_escolar` mediante el Panel de Supabase
- [ ] Copiar datos de `año_escolar` a `periodo_escolar` para registros existentes
- [ ] Verificar que todos los datos se hayan transferido correctamente

### Fase 4: Transición completa (Pendiente)

- [ ] Configurar triggers para mantener las columnas sincronizadas
- [ ] Deprecar gradualmente el uso de `año_escolar` en el código nuevo
- [ ] Documentar el cambio para otros desarrolladores

### Fase 5: Limpieza (Futuro)

- [ ] Eliminar referencias a `año_escolar` en todo el código
- [ ] Eliminar la columna `año_escolar` cuando sea seguro
- [ ] Actualizar documentación para reflejar el cambio completo

## Acciones inmediatas

1. Acceder al Panel de Supabase y añadir la columna `periodo_escolar` de tipo TEXT a la tabla `grupos`
2. Ejecutar la siguiente consulta para copiar los datos:
   ```sql
   UPDATE grupos SET periodo_escolar = año_escolar WHERE periodo_escolar IS NULL;
   ```
3. Verificar que la aplicación funcione correctamente después del cambio

## Impacto

Este enfoque gradual nos permite:
1. Mejorar la calidad del código al seguir mejores prácticas
2. Evitar problemas potenciales con caracteres especiales
3. Aclarar el concepto para que incluya semestres además de años
4. No interrumpir el funcionamiento del sistema durante la transición
5. Minimizar riesgos al realizar una migración escalonada
