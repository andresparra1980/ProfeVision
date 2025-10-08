# Migración de Toasts a Sonner - Progreso

## ✅ Completados

### Core
- [x] `components/shared/client-layout.tsx` - Removido Radix Toaster, usando solo Sonner

### Exams
- [x] `app/[locale]/dashboard/exams/components/SimilarExamModal.tsx`
- [x] `app/[locale]/dashboard/exams/[id]/export/page.tsx` - Solo import actualizado
- [x] `app/[locale]/dashboard/exams/[id]/edit/page.tsx` - Solo import actualizado

### AI Chat  
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ChatPanel.tsx`
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/SaveDraftDialog.tsx`
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/DraftLoader.tsx`
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/hooks/useChatMessages.ts`
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/hooks/useClearChat.ts`
- [x] `app/[locale]/dashboard/exams/ai-exams-creation-chat/hooks/useExamDraft.ts`

### Groups
- [x] `app/[locale]/dashboard/groups/[id]/grades/page.tsx` - ✅ COMPLETO (imports + sintaxis)
- [x] `app/[locale]/dashboard/groups/[id]/grading-scheme/page.tsx` - Solo import actualizado
- [x] `app/[locale]/dashboard/groups/[id]/students/page.tsx` - Solo import actualizado
- [x] `app/[locale]/dashboard/groups/page.tsx` - Solo import actualizado

## 🔄 Pendientes (Solo Sintaxis de toast())

Estos archivos ya tienen el import de Sonner pero necesitan actualizar las llamadas a toast():

1. `app/[locale]/dashboard/groups/[id]/grading-scheme/page.tsx` - 1 toast()
2. `app/[locale]/dashboard/groups/[id]/students/page.tsx` - ~8 toast()
3. `app/[locale]/dashboard/groups/page.tsx` - ~5 toast()
4. `app/[locale]/dashboard/exams/[id]/edit/page.tsx` - ~15 toast()
5. `app/[locale]/dashboard/exams/[id]/export/page.tsx` - ~4 toast()
6. `app/[locale]/dashboard/exams/[id]/results/page.tsx` - Needs full migration
7. `app/[locale]/dashboard/exams/create/page.tsx` - Needs full migration
8. `app/[locale]/dashboard/exams/create-with-ai/page.tsx` - Needs full migration
9. `app/[locale]/dashboard/settings/page.tsx` - Needs full migration
10. `app/[locale]/dashboard/students/page.tsx` - Needs full migration
11. `app/[locale]/dashboard/profile/page.tsx` - Needs full migration
12. `app/[locale]/dashboard/subjects/page.tsx` - Needs full migration
13. `app/[locale]/dashboard/layout.tsx` - Needs full migration
14. `app/[locale]/dashboard/entities/page.tsx` - Needs full migration
15. `components/grades/grades-excel-modal.tsx` - Needs full migration
16. `components/grading/grading-scheme-editor.tsx` - Needs full migration
17. `components/students/excel-import.tsx` - Needs full migration
18. `components/exam/wizard-steps/results.tsx` - Needs full migration

## Patrón de Migración

```typescript
// Antes (Radix UI)
toast({
  variant: 'destructive',
  title: 'Error',
  description: 'Message'
})

// Después (Sonner)  
toast.error('Error', {
  description: 'Message'
})

// Success/Info
toast({
  title: 'Success',
  description: 'Message'
})

// Se convierte en:
toast.success('Success', {
  description: 'Message'
})
```

## Próximos Pasos

1. Continuar con archivos de grupos (students, grading-scheme)
2. Migrar archivos de exams restantes
3. Migrar componentes reutilizables
4. Migrar páginas de dashboard generales
5. Testing final
6. Commit y PR
