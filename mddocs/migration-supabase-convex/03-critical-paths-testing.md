# Critical Paths Testing

Suite de tests de caminos críticos del sistema ProfeVision post-migración.

**Nota:** Esta fase se ejecuta progresivamente después de que la migración esté completada y probada manualmente.

---

## Configuración de Testing

### Frameworks

| Tipo | Framework | Propósito |
|------|-----------|-----------|
| Unit Tests | Jest + @convex-testing | Queries/Mutations Convex |
| Integration Tests | Jest + @convex-testing | Flujos completos |
| E2E Tests (Web) | Playwright | Tests de navegador |
| E2E Tests (Mobile) | Detox/Appium | Tests de app móvil |
| Performance Tests | Artillery/K6 | Tests de carga |

### Configuración Inicial

- [ ] Configurar entorno de testing para Convex
- [ ] Configurar testing para Clerk (mocks de auth)
- [ ] Configurar testing para React Native (Detox)
- [ ] Configurar E2E tests (Playwright para Web)
- [ ] Establecer CI/CD para ejecutar tests automáticamente

---

## Tests Unitarios

### Convex Functions

#### Queries de datos básicos
- [ ] `getMyExams` - Retorna exámenes del profesor actual
- [ ] `getMySubjects` - Retorna materias del profesor actual
- [ ] `getMyGroups` - Retorna grupos del profesor actual
- [ ] `getMyStudents` - Retorna estudiantes del profesor actual
- [ ] `getExamById` - Retorna examen por ID
- [ ] `getQuestionsByExam` - Retorna preguntas de un examen

#### Mutaciones de creación
- [ ] `createExam` - Crea nuevo examen
- [ ] `createStudent` - Crea nuevo estudiante
- [ ] `createSubject` - Crea nueva materia
- [ ] `createGroup` - Crea nuevo grupo
- [ ] `addStudentToGroup` - Asigna estudiante a grupo

#### Mutaciones de actualización
- [ ] `updateExam` - Actualiza examen
- [ ] `updateStudent` - Actualiza estudiante
- [ ] `updateGrades` - Actualiza calificaciones
- [ ] `updateOnboardingStatus` - Actualiza estado de onboarding

#### Validaciones de auth en funciones
- [ ] Usuario autenticado puede acceder
- [ ] Usuario no autenticado es rechazado
- [ ] Usuario A no puede ver datos de usuario B

#### Tests de límites de tier
- [ ] `checkFeatureLimit` - Verifica límite de IA
- [ ] `checkFeatureLimit` - Verifica límite de escaneos
- [ ] Tier free respeta límites
- [ ] Tier plus tiene límites ilimitados

#### Tests de tracking de uso
- [ ] `incrementFeatureUsage` - Incrementa contador
- [ ] `getOrCreateUsageTracking` - Crea tracking mensual
- [ ] Tracking resetea cada mes

### Helper Functions

- [ ] `getMe()` - Retorna usuario autenticado
- [ ] Validación de permisos en helpers
- [ ] Deep merge en onboarding

---

## Tests de Integración

### Flujo de Creación de Examen

```typescript
describe('Exam Creation Flow', () => {
  it('creates complete exam with questions', async () => {
    // 1. Crear materia
    const subject = await createSubject({ name: 'Matemáticas' })

    // 2. Crear grupo en materia
    const group = await createGroup({ subjectId: subject._id, name: '101A' })

    // 3. Crear examen en materia
    const exam = await createExam({
      subjectId: subject._id,
      title: 'Parcial 1'
    })

    // 4. Agregar preguntas con opciones
    const question = await addQuestion({
      examId: exam._id,
      text: '¿Cuánto es 2+2?',
      score: 10
    })
    await addAnswerOption({
      questionId: question._id,
      text: '4',
      isCorrect: true
    })

    // 5. Aplicar examen a grupo
    const application = await applyExamToGroup({
      examId: exam._id,
      groupId: group._id
    })

    // 6. Verificar que el profesor solo ve sus datos
    const exams = await getMyExams()
    expect(exams).toContainEqual(expect.objectContaining({
      _id: exam._id
    }))
  })
})
```

### Flujo de Calificación

- [ ] Crear esquema de calificación
- [ ] Crear periodos (trimestres)
- [ ] Crear componentes (exámenes, tareas)
- [ ] Asignar porcentajes
- [ ] Asignar calificaciones a estudiantes
- [ ] Verificar cálculo de nota final
- [ ] Exportar reportes

### Flujo de Onboarding

- [ ] Registro nuevo usuario
- [ ] Creación automática de teacher
- [ ] Actualización de onboarding_status
- [ ] Completar wizard y checklist

---

## Tests de Caminos Críticos (Critical Paths)

### Camino 1: Creación y Aplicación de Examen

**Flujo:**
1. Login con Clerk
2. Crear entidad educativa
3. Crear materia
4. Crear grupo
5. Importar estudiantes (Excel)
6. Crear examen con preguntas
7. Generar PDF
8. Escanear exámenes (OMR)
9. Verificar calificaciones automáticas
10. Verificar límites de tier

**Tests:**
- [ ] Autenticación exitosa con Clerk
- [ ] Creación de entidad educativa
- [ ] Creación de materia y grupo
- [ ] Importación de estudiantes desde Excel
- [ ] Creación de examen con preguntas
- [ ] Generación de PDF
- [ ] Upload de escaneo
- [ ] Procesamiento OMR
- [ ] Verificación de calificaciones automáticas
- [ ] Verificación de límites de tier

### Camino 2: Gestión de Grading

**Flujo:**
1. Crear esquema de calificación
2. Definir periodos (trimestres)
3. Crear componentes (exámenes, tareas, proyectos)
4. Asignar porcentajes
5. Asignar notas a estudiantes
6. Verificar cálculo de nota final
7. Exportar reportes

**Tests:**
- [ ] Crear esquema de calificación
- [ ] Definir periodos
- [ ] Crear componentes
- [ ] Asignar porcentajes
- [ ] Asignar notas
- [ ] Calcular nota final
- [ ] Exportar reportes

### Camino 3: IA y Exámenes Similares

**Flujo:**
1. Seleccionar examen existente
2. Iniciar generación de examen similar
3. Verificar proceso en cola
4. Completar generación
5. Validar preguntas generadas
6. Verificar límites de IA usados

**Tests:**
- [ ] Seleccionar examen existente
- [ ] Iniciar generación de examen similar
- [ ] Verificar proceso en cola
- [ ] Completar generación
- [ ] Validar preguntas generadas
- [ ] Verificar límites de IA usados

### Camino 4: Suscripción y Tiers

**Flujo:**
1. Usuario free usa features
2. Llega a límite de escaneos
3. Realiza upgrade a plus
4. Webhook de Polar actualiza tier
5. Usuario usa features ilimitadas
6. Verificar tracking de uso

**Tests:**
- [ ] Usuario free usa features
- [ ] Llega a límite de escaneos
- [ ] Realiza upgrade a plus
- [ ] Webhook de Polar actualiza tier
- [ ] Usuario usa features ilimitadas
- [ ] Verificar tracking de uso

### Camino 5: Multi-Plataforma (Web + Mobile)

**Flujo:**
1. Crear datos en Web
2. Abrir app Mobile
3. Verificar sincronización de datos
4. Modificar datos en Mobile
5. Verificar updates en Web (real-time)

**Tests:**
- [ ] Crear datos en Web
- [ ] Abrir app Mobile
- [ ] Verificar sincronización de datos
- [ ] Modificar datos en Mobile
- [ ] Verificar updates en Web (real-time)

---

## Tests E2E

### Web (Playwright)

#### Flujo completo de onboarding
- [ ] Navegar a `/`
- [ ] Hacer click en "Sign up"
- [ ] Completar registro
- [ ] Verificar wizard de onboarding
- [ ] Completar wizard paso a paso
- [ ] Verificar dashboard post-onboarding

#### Creación de examen completo
- [ ] Ir a `/exams`
- [ ] Hacer click en "New Exam"
- [ ] Seleccionar materia
- [ ] Ingresar título y descripción
- [ ] Agregar preguntas
- [ ] Agregar opciones a preguntas
- [ ] Guardar examen
- [ ] Verificar examen en lista

#### Importación de estudiantes desde Excel
- [ ] Ir a `/students`
- [ ] Hacer click en "Import"
- [ ] Subir archivo Excel
- [ ] Verificar vista previa
- [ ] Confirmar importación
- [ ] Verificar estudiantes en lista

#### Dashboard y navegación
- [ ] Navegar entre secciones
- [ ] Verificar carga de datos
- [ ] Verificar responsive design

### Mobile (Detox/Appium)

- [ ] Login con Clerk
- [ ] Listado de exámenes
- [ ] Creación de examen básico
- [ ] Navegación entre pantallas
- [ ] Verificar sincronización con Convex

---

## Tests de Performance y Carga

### Tests de queries con 1000+ estudiantes
- [ ] Query de estudiantes performa aceptable
- [ ] Paginación funciona correctamente
- [ ] Sin memory leaks

### Tests de reactividad (real-time updates)
- [ ] Updates se propagan en < 100ms
- [ ] Múltiples clientes reciben updates
- [ ] Conexiones WebSocket se mantienen

### Tests de concurrencia
- [ ] 100 profesores crean exámenes simultáneamente
- [ ] 500 escaneos en proceso simultáneamente
- [ ] Sin race conditions

### Tests de límites de Convex
- [ ] 1000 ops/sec
- [ ] 10GB de almacenamiento
- [ ] 1M documentos

---

## Tests de Seguridad

### Permisos de acceso
- [ ] Usuario A no puede ver datos de usuario B
- [ ] Usuario sin auth no puede acceder a datos
- [ ] Validación de RLS reemplazado por functions

### Tier limits enforcement
- [ ] Usuario free respeta límites
- [ ] Usuario con tier vencido no puede acceder
- [ ] Upgrade de tier actualiza límites inmediatamente

### Rate limiting
- [ ] Protección contra abuso de API
- [ ] Límites de requests por usuario

---

## Estrategia Progresiva

### Sprint 1 (1 semana)

**Objetivo:** Configurar testing framework + tests unitarios críticos

- [ ] Configurar Jest + @convex-testing
- [ ] Configurar mocks de Clerk
- [ ] Tests unitarios de queries críticas
- [ ] Tests unitarios de mutations críticas
- [ ] Tests de caminos críticos #1 (Examen)

### Sprint 2 (1 semana)

**Objetivo:** Tests de integración + caminos críticos

- [ ] Tests de integración principales
- [ ] Tests de caminos críticos #2 (Grading) y #3 (IA)
- [ ] Tests de seguridad básicos

### Sprint 3 (1 semana)

**Objetivo:** E2E tests + performance

- [ ] Configurar Playwright
- [ ] Tests E2E básicos
- [ ] Tests de performance
- [ ] Tests de caminos críticos #4 (Suscripción)

### Sprint 4 (1 semana)

**Objetivo:** Mejorar cobertura + CI/CD

- [ ] Mejorar cobertura al objetivo
- [ ] Documentar tests
- [ ] Configurar CI/CD automático (GitHub Actions)
- [ ] Tests de caminos críticos #5 (Multi-plataforma)

---

## Cobertura Objetivo

| Tipo de Test | Cobertura Mínima | Prioridad |
|--------------|------------------|-----------|
| Unit Tests (Convex) | 70% | Alta |
| Integration Tests | 50% | Alta |
| E2E Tests | Critical paths only | Media |
| Security Tests | 100% de auth | Alta |

---

## Scripts de Testing

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests unitarios
```bash
npm run test:unit
```

### Ejecutar tests de integración
```bash
npm run test:integration
```

### Ejecutar tests E2E
```bash
npm run test:e2e
```

### Ejecutar tests de performance
```bash
npm run test:performance
```

---

## CI/CD Configuration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
```

---

## Recursos

- [Convex Testing Guide](https://docs.convex.dev/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Detox Documentation](https://wix.github.io/Detox/docs/introduction)
