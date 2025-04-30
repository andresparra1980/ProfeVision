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
  questionNumber?: number;
}

export function ModalGenerateAI({ onOpenChange, onSuccess, open, questionNumber }: ModalGenerateAIProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [planDefault, setPlanDefault] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    // Aquí puedes limpiar el formulario o errores si es necesario
    // No llamar a onOpenChange aquí para evitar loops
    form.reset();
    setError(null);
  }, [form]);

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      modal={true}
    >
      <DialogContent ref={modalContentRef}>
        <DialogHeader>
          <DialogTitle>
            <Sparkles className="inline mr-2 text-rose-600 dark:text-fuchsia-400" /> Generar pregunta con IA
            {typeof questionNumber === 'number' && (
              <span className="ml-2 text-xs text-muted-foreground">(Pregunta {questionNumber + 1})</span>
            )}
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
                  <Input {...field} placeholder="Ej: Fotosíntesis" className="placeholder:text-muted-foreground/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="dificultad" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Dificultad*</FormLabel>
                <FormControl>
                  <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                  >
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
                  <Input type="number" min={2} max={4} {...field} onChange={e => field.onChange(Number(e.target.value))} className="placeholder:text-muted-foreground/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="instrucciones" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Instrucciones para generar la pregunta*</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe la pregunta que deseas generar, el enfoque, etc." rows={2} className="placeholder:text-muted-foreground/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="estilo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Estilo (opcional)</FormLabel>
                <FormControl>
                  <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                  >
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
                  <Textarea {...field} placeholder="Pega aquí la sección relevante del plan de estudios" rows={4} className="placeholder:text-muted-foreground/50" />
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