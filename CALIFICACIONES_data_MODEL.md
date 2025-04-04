# Modelo de Datos de Calificaciones

## Tabla: calificaciones

### Estructura
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único de la calificación |
| estudiante_id | UUID | NOT NULL, REFERENCES estudiantes(id) | ID del estudiante al que pertenece la calificación |
| componente_id | UUID | NOT NULL, REFERENCES componentes_calificacion(id) | ID del componente de calificación |
| valor | NUMERIC(4,2) | NOT NULL, CHECK (valor >= 0 AND valor <= 5) | Valor de la calificación (entre 0 y 5) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc'::text, now()) | Fecha y hora de creación |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT timezone('utc'::text, now()) | Fecha y hora de última actualización |

### Restricciones
- Clave única compuesta: (estudiante_id, componente_id)
- Las calificaciones deben estar entre 0 y 5
- Eliminación en cascada cuando se elimina un estudiante o componente

## Seguridad (Row Level Security)

### Políticas de Acceso

#### Política de Lectura (SELECT)
- **Nombre**: view_calificaciones
- **Acceso permitido a**:
  - Profesor del grupo al que pertenece la calificación
  - Estudiante dueño de la calificación

#### Política de Inserción (INSERT)
- **Nombre**: insert_calificaciones
- **Acceso permitido a**:
  - Solo el profesor del grupo puede insertar calificaciones

#### Política de Actualización (UPDATE)
- **Nombre**: update_calificaciones
- **Acceso permitido a**:
  - Solo el profesor del grupo puede actualizar calificaciones

## Funciones de Cálculo

### calcular_promedio_periodo
```sql
FUNCTION calcular_promedio_periodo(periodo_id UUID, estudiante_id UUID) RETURNS NUMERIC
```
- **Descripción**: Calcula el promedio ponderado de las calificaciones de un estudiante en un periodo específico
- **Seguridad**: SECURITY DEFINER
- **Lógica**: 
  - Suma las calificaciones multiplicadas por sus porcentajes
  - Divide por 100 para obtener el promedio ponderado
  - Retorna 0 si no hay calificaciones

### calcular_nota_final
```sql
FUNCTION calcular_nota_final(esquema_id UUID, estudiante_id UUID) RETURNS NUMERIC
```
- **Descripción**: Calcula la nota final de un estudiante en un esquema de calificación
- **Seguridad**: SECURITY DEFINER
- **Lógica**:
  - Suma los promedios de cada periodo multiplicados por sus porcentajes
  - Divide por 100 para obtener la nota final ponderada
  - Retorna 0 si no hay calificaciones

## Triggers

### update_calificaciones_updated_at
- **Evento**: BEFORE UPDATE
- **Por cada**: ROW
- **Acción**: Actualiza el campo updated_at con la fecha y hora actual en UTC

## Relaciones
- **estudiantes**: Una calificación pertenece a un estudiante
- **componentes_calificacion**: Una calificación pertenece a un componente de calificación
- **periodos_calificacion**: Relación indirecta a través de componentes_calificacion
- **esquemas_calificacion**: Relación indirecta a través de periodos_calificacion
- **grupos**: Relación indirecta a través de esquemas_calificacion

## Notas de Implementación
1. Las calificaciones se almacenan con precisión de dos decimales
2. El sistema utiliza UTC para todas las marcas de tiempo
3. La seguridad está implementada a nivel de fila usando RLS
4. Las funciones de cálculo son SECURITY DEFINER para garantizar acceso consistente
5. Las eliminaciones son en cascada para mantener la integridad referencial 