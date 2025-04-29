import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Definir tipos para la integración con el sistema de preguntas
type Opcion = {
  id: string;
  texto: string;
  esCorrecta: boolean;
};

type TipoPregunta = 'opcion_multiple' | 'seleccion_multiple' | 'verdadero_falso';

type Pregunta = {
  id: string;
  texto: string;
  opciones: Opcion[];
  tipo: TipoPregunta;
  puntaje: number;
  retroalimentacion?: string;
};

const DIFFICULTY_OPTIONS = [
  { value: 'básico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];
const STYLE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'caso clínico', label: 'Caso clínico' },
];

const LOCAL_STORAGE_PLAN_KEY = 'planEstudiosSeccion';

const schema = z.object({
  tema: z.string().min(2, 'El tema es obligatorio'),
  dificultad: z.enum(['básico', 'intermedio', 'avanzado'], {
    required_error: 'Selecciona una dificultad',
  }),
  numOpciones: z.number().min(2).max(4),
  instrucciones: z.string().min(5, 'Las instrucciones son obligatorias'),
  estilo: z.enum(['formal', 'informal', 'caso clínico']).optional(),
  seccionPlan: z.string().min(10, 'La sección del plan de estudios es obligatoria'),
});

type GenerateIAForm = z.infer<typeof schema>;

interface ModalGenerateAIProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess: (_pregunta: Pregunta) => void;
}

export function ModalGenerateAI({ onOpenChange, onSuccess, open }: ModalGenerateAIProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [planDefault, setPlanDefault] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado local para controlar la apertura/cierre sin delegar en Dialog
  const [isInternalOpen, setIsInternalOpen] = useState(open);
  
  // Sincronizar estado interno con prop externo
  useEffect(() => {
    setIsInternalOpen(open);
  }, [open]);

  // Recuperar sección del plan de estudios de localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAN_KEY);
      if (saved) setPlanDefault(saved);
    }
  }, []);

  const form = useForm<GenerateIAForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      tema: '',
      dificultad: 'básico',
      numOpciones: 4,
      instrucciones: '',
      estilo: 'formal',
      seccionPlan: planDefault,
    },
  });

  // Actualizar el valor por defecto si cambia en localStorage
  useEffect(() => {
    if (planDefault && !form.getValues('seccionPlan')) {
      form.setValue('seccionPlan', planDefault);
    }
    // eslint-disable-next-line
  }, [planDefault]);

  // Guardar sección del plan de estudios en localStorage al cambiar
  useEffect(() => {
    const sub = form.watch((values) => {
      if (values.seccionPlan && typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_PLAN_KEY, values.seccionPlan);
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Limpiar el foco antes de cerrar el modal
  const handleCloseModal = useCallback(() => {
    // 1. Bloquear cualquier elemento interactivo con inert
    if (modalContentRef.current) {
      const interactiveElements = modalContentRef.current.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex], [contenteditable]'
      );
      
      // Establecer inert en todos los elementos interactivos
      interactiveElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.blur();
          // Intentar hacer que el elemento no sea enfocable temporalmente
          el.setAttribute('tabindex', '-1');
        }
      });
    }

    // 2. Forzar el foco al documento body
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // 3. Usar un hack para mover el foco fuera del modal
    try {
      const dummy = document.createElement('button');
      dummy.style.position = 'fixed';
      dummy.style.opacity = '0';
      dummy.style.pointerEvents = 'none';
      dummy.style.top = '-1000px';
      document.body.appendChild(dummy);
      dummy.focus();
      dummy.blur();
      document.body.removeChild(dummy);
    } catch (e) {
      console.error('Error al quitar foco:', e);
    }
    
    // 4. Pequeño delay antes de cerrar completamente
    setTimeout(() => {
      setIsInternalOpen(false);
      onOpenChange(false);
    }, 50);
  }, [onOpenChange]);

  const handleSubmit = async (values: GenerateIAForm) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('No autenticado. Inicia sesión nuevamente.');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/exams/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error generando pregunta');
      }
      const data = await res.json();
      
      // Limpiar foco antes de cerrar
      handleCloseModal();
      // Notificar éxito
      onSuccess(data as Pregunta);
      form.reset();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={isInternalOpen} 
      onOpenChange={(newState) => {
        if (!newState) {
          handleCloseModal();
        } else {
          setIsInternalOpen(true);
          onOpenChange(true);
        }
      }}
    >
      <DialogContent ref={modalContentRef}>
        <DialogHeader>
          <DialogTitle>
            <Sparkles className="inline mr-2 text-yellow-500" /> Generar pregunta con IA
          </DialogTitle>
          <DialogDescription>
            Completa los campos para generar una pregunta personalizada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField name="tema" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Tema*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: Fotosíntesis" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="dificultad" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Dificultad*</FormLabel>
                <FormControl>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="numOpciones" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Número de opciones*</FormLabel>
                <FormControl>
                  <Input type="number" min={2} max={4} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="instrucciones" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Instrucciones para generar la pregunta*</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe la pregunta que deseas generar, el enfoque, etc." rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="estilo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Estilo (opcional)</FormLabel>
                <FormControl>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="seccionPlan" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Sección del plan de estudios*</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Pega aquí la sección relevante del plan de estudios" rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {error && <div className="text-destructive text-sm">{error}</div>}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Generando...' : 'Generar pregunta'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 