# Guía de Calidad de Código para ProfeVision

## Reglas Generales

### Variables y Tipos

1. **Evitar `any`**: Siempre use tipos específicos en lugar de `any`. Si es necesario manejar tipos desconocidos, usar `unknown` y realizar validación de tipo.

2. **Variables no utilizadas**: 
   - Prefije las variables no utilizadas con `_` (ej: `_unusedVar`)
   - Elimine las variables que no se utilizan
   - Use destructuring para seleccionar solo lo que necesita: `const { data } = await response.json()` en lugar de obtener todo el objeto

3. **Interfaces vacías**: No cree interfaces que no añadan propiedades. Si necesita extender un tipo, hágalo directamente.

### Manejo de Errores

1. **Errores tipados**: En bloques catch, utilice `error as Error` o `error as unknown` y luego valide el tipo.

2. **Mensajes claros**: Proporcione mensajes de error descriptivos para facilitar la depuración.

3. **Logger central**: Utilice el logger centralizado (`lib/utils/logger.ts`) en lugar de `console.log/error`.

## Logging y Depuración

### Uso del Logger

```typescript
import logger from '@/lib/utils/logger';

// Ejemplos de uso
logger.log('Procesando imagen', { imageId: '123' });
logger.error('Error al procesar la imagen', error);
logger.api('/api/exams/process-scan', { status: 'success' });
```

### Ventajas del Logger Centralizado

1. **Consistencia**: Formato uniforme en todos los logs
2. **Control**: Solo se muestran en desarrollo, no en producción
3. **Extensibilidad**: Fácil de modificar para añadir nuevas funcionalidades (como enviar errores a un servicio)

## ESLint y Herramientas

### Ejecutar ESLint

```bash
# Verificar problemas
npx eslint . --ext .ts,.tsx

# Arreglar automáticamente problemas sencillos
npx eslint . --ext .ts,.tsx --fix
```

### Reglas Principales de ESLint

- Variables no utilizadas (`@typescript-eslint/no-unused-vars`)
- Prohibición de `any` (`@typescript-eslint/no-explicit-any`)
- Preferencia por `const` sobre `let` cuando sea posible (`prefer-const`)
- Restricción de `console.log` directo (`no-console`)

## Prácticas Recomendadas

### Patrones a Seguir

1. **Estado y Props Tipados**:
   ```typescript
   interface ComponentProps {
     data: DataType;
     onAction: (id: string) => void;
   }
   
   export function Component({ data, onAction }: ComponentProps) {
     // ...
   }
   ```

2. **Control de Efectos Secundarios**:
   ```typescript
   useEffect(() => {
     // Efecto aquí
     return () => {
       // Limpieza aquí
     };
   }, [dependencias]); // Siempre especificar dependencias
   ```

3. **Manejo de API**:
   ```typescript
   try {
     const response = await fetch('/api/endpoint');
     if (!response.ok) {
       throw new Error(`Error: ${response.status}`);
     }
     const data = await response.json();
     // Procesar datos
   } catch (error) {
     logger.error('Error en la petición API', error);
     // Manejo de error
   }
   ```

### Recursos Adicionales

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [ESLint Rules](https://eslint.org/docs/rules/)

## Proceso de Revisión de Código

1. Ejecutar ESLint antes de cada commit
2. Verificar que no hay warnings ni errores
3. Asegurar que la nueva funcionalidad sigue las pautas de estilo establecidas
4. Para PRs, usar la lista de verificación de calidad de código 