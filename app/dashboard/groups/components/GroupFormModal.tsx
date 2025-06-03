"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isWithinInterval, startOfYear, endOfYear, addYears, startOfMonth, endOfMonth, setMonth, setYear } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import type { Database } from "@/lib/types/database";

type Grupo = Database["public"]["Tables"]["grupos"]["Row"] & {
  materias: {
    id: string;
    nombre: string;
    entidades_educativas: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  estudiantes_count: { count: number } | number;
  entidad_id?: string;
  estado: 'activo' | 'archivado';
};

type EntidadEducativa = Database["public"]["Tables"]["entidades_educativas"]["Row"];

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas: EntidadEducativa | null;
};

const grupoSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  descripcion: z.string().optional(),
  entidad_id: z.string({ required_error: "Selecciona una entidad educativa" }),
  materia_id: z.string({ required_error: "Selecciona una materia" }),
  periodo_escolar: z.string().optional(),
});

type GrupoFormValues = z.infer<typeof grupoSchema>;

interface GroupFormModalProps {
  open: boolean;
  onOpenChangeAction: (_open: boolean) => void;
  editingGrupo: Grupo | null;
  entidades: EntidadEducativa[];
  materias: Materia[];
  materiasFiltradas: Materia[];
  onSubmitAction: (_data: GrupoFormValues) => Promise<void>;
  onSetMateriasFiltradasAction: (_materias: Materia[]) => void;
  mostrarArchivados: boolean;
}

export function GroupFormModal({
  open,
  onOpenChangeAction,
  editingGrupo,
  entidades,
  materias,
  materiasFiltradas,
  onSubmitAction,
  onSetMateriasFiltradasAction,
  mostrarArchivados
}: GroupFormModalProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const form = useForm<GrupoFormValues>({
    resolver: zodResolver(grupoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      entidad_id: "",
      materia_id: "",
      periodo_escolar: "",
    },
  });

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(setMonth(new Date(), i), 'MMMM', { locale: es })
  }));

  // Función para interpretar el período escolar
  const interpretarPeriodoEscolar = (desde?: Date, hasta?: Date): string => {
    if (!desde || !hasta) return "";

    // Formatear fechas para comparación
    const inicioAno = startOfYear(desde);
    const finAno = endOfYear(desde);
    const inicioSiguienteAno = startOfYear(addYears(desde, 1));
    const finSiguienteAno = endOfYear(addYears(desde, 1));

    // Verificar si es un año lectivo (cruza dos años)
    if (
      isWithinInterval(desde, { start: startOfMonth(inicioAno), end: endOfMonth(finAno) }) &&
      isWithinInterval(hasta, { start: startOfMonth(inicioSiguienteAno), end: endOfMonth(finSiguienteAno) })
    ) {
      return `Año lectivo ${format(desde, 'yyyy')}-${format(hasta, 'yyyy')}`;
    }

    // Verificar si es un semestre
    const mesInicio = desde.getMonth();
    const mesFin = hasta.getMonth();
    
    // Primer semestre: Enero/Febrero a Mayo/Junio
    if ((mesInicio === 0 || mesInicio === 1) && (mesFin === 4 || mesFin === 5)) {
      return `${format(desde, 'yyyy')} Primer semestre`;
    }
    
    // Segundo semestre: Julio/Agosto a Noviembre/Diciembre
    if ((mesInicio === 6 || mesInicio === 7) && (mesFin === 10 || mesFin === 11)) {
      return `${format(desde, 'yyyy')} Segundo semestre`;
    }

    // Si no coincide con ningún patrón, devolver solo mes y año
    return `${format(desde, 'MMMM yyyy', { locale: es })} - ${format(hasta, 'MMMM yyyy', { locale: es })}`;
  };

  const updatePeriodoEscolar = (inicio?: Date | null, fin?: Date | null) => {
    if (inicio && fin) {
      const periodoInterpretado = interpretarPeriodoEscolar(inicio, fin);
      form.setValue("periodo_escolar", periodoInterpretado);
    } else {
      form.setValue("periodo_escolar", "");
    }
  };

  const handleStartDateChange = (month: number, year: number) => {
    const newDate = setYear(setMonth(new Date(), month), year);
    setStartDate(startOfMonth(newDate));
    if (endDate) {
      // Si la nueva fecha de inicio es posterior a la fecha de fin
      if (newDate > endDate) {
        // Si están en el mismo año y el mes de inicio es mayor, ajustamos el año de fin
        if (year === endDate.getFullYear() && month > endDate.getMonth()) {
          const newEndDate = setYear(endDate, year + 1);
          setEndDate(endOfMonth(newEndDate));
          updatePeriodoEscolar(startOfMonth(newDate), endOfMonth(newEndDate));
          return;
        }
        setEndDate(null);
      }
    }
    updatePeriodoEscolar(startOfMonth(newDate), endDate);
  };

  const handleEndDateChange = (month: number, year: number) => {
    const newDate = setYear(setMonth(new Date(), month), year);
    setEndDate(endOfMonth(newDate));
    if (startDate) {
      // Si la nueva fecha de fin es anterior a la fecha de inicio
      if (newDate < startDate) {
        setStartDate(null);
      }
    }
    updatePeriodoEscolar(startDate, endOfMonth(newDate));
  };

  // Filtrar materias cuando cambia la entidad seleccionada
  const entidadSeleccionada = form.watch("entidad_id");
  
  useEffect(() => {
    if (entidadSeleccionada) {
      const materiasFiltradasPorEntidad = materias.filter(
        (materia) => materia.entidades_educativas?.id === entidadSeleccionada
      );
      onSetMateriasFiltradasAction(materiasFiltradasPorEntidad);
      
      // Si la materia actual no está en las materias filtradas, resetear
      const materiaActual = form.watch("materia_id");
      if (materiaActual && !materiasFiltradasPorEntidad.some(m => m.id === materiaActual)) {
        form.setValue("materia_id", "");
      }
    } else {
      onSetMateriasFiltradasAction([]);
      form.setValue("materia_id", "");
    }
  }, [entidadSeleccionada, materias, onSetMateriasFiltradasAction, form]);

  // Resetear formulario cuando se abre/cierra el modal o cambia el grupo en edición
  useEffect(() => {
    if (open && editingGrupo) {
      // Cargar datos del grupo para editar
      form.setValue("nombre", editingGrupo.nombre);
      form.setValue("descripcion", editingGrupo.descripcion || "");
      
      if (editingGrupo.materias) {
        const entidadId = editingGrupo.materias.entidades_educativas?.id;
        if (entidadId) {
          form.setValue("entidad_id", entidadId);
          form.setValue("materia_id", editingGrupo.materias.id);
        }
      }
      
      form.setValue("periodo_escolar", editingGrupo.periodo_escolar || "");
    } else if (open && !editingGrupo) {
      // Limpiar formulario para nuevo grupo
      form.reset({
        nombre: "",
        descripcion: "",
        entidad_id: "",
        materia_id: "",
        periodo_escolar: "",
      });
      setStartDate(null);
      setEndDate(null);
    }
  }, [open, editingGrupo, form]);

  const onSubmit = async (data: GrupoFormValues) => {
    await onSubmitAction(data);
  };

  const handleClose = () => {
    onOpenChangeAction(false);
  };

  return (
    <>
      {!mostrarArchivados && (
        <Dialog open={open} onOpenChange={onOpenChangeAction} modal={true}>
          <DialogTrigger asChild>
            <Button onClick={() => onOpenChangeAction(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] bg-[#FAFAF4] dark:bg-[#171717]">
            <DialogHeader>
              <DialogTitle>{editingGrupo ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
              <DialogDescription>
                {editingGrupo 
                  ? "Actualiza la información del grupo." 
                  : "Ingresa los datos del nuevo grupo."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del grupo (Ej: 10-A, Grupo Mañana, etc.)*</Label>
                <Input
                  id="nombre"
                  placeholder=""
                  className="bg-white dark:bg-[#1E1E1F]"
                  {...form.register("nombre")}
                />
                {form.formState.errors.nombre && (
                  <div className="text-sm text-destructive">{form.formState.errors.nombre.message}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entidad">Entidad Educativa*</Label>
                <Select
                  onValueChange={(value: string) => form.setValue("entidad_id", value)}
                  value={form.watch("entidad_id")}
                >
                  <SelectTrigger id="entidad" className="bg-white dark:bg-[#1E1E1F]">
                    <SelectValue placeholder="Selecciona una entidad educativa" />
                  </SelectTrigger>
                  <SelectContent>
                    {entidades.length > 0 ? (
                      <>
                        {entidades.map((entidad) => (
                          <SelectItem key={entidad.id} value={entidad.id}>
                            {entidad.nombre}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <SelectItem value="no-entidades" disabled>
                        No hay entidades educativas registradas
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.entidad_id && (
                  <div className="text-sm text-destructive">{form.formState.errors.entidad_id.message}</div>
                )}
                {entidades.length === 0 && (
                  <div className="text-xs text-destructive">
                    Debes crear al menos una entidad educativa antes de crear un grupo.
                    <Link href="/dashboard/entidades-educativas" className="ml-1 text-primary hover:underline">
                      Crear entidad educativa
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="materia">Materia*</Label>
                <Select
                  onValueChange={(value: string) => form.setValue("materia_id", value)}
                  value={form.watch("materia_id")}
                  disabled={!form.watch("entidad_id")}
                >
                  <SelectTrigger id="materia" className="bg-white dark:bg-[#1E1E1F]">
                    <SelectValue placeholder={
                      form.watch("entidad_id") 
                        ? "Selecciona una materia" 
                        : "Primero selecciona una entidad educativa"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {materiasFiltradas.length > 0 ? (
                      materiasFiltradas.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-materias" disabled>
                        {form.watch("entidad_id") 
                          ? "No hay materias para esta entidad educativa" 
                          : "Selecciona primero una entidad educativa"
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.materia_id && (
                  <div className="text-sm text-destructive">{form.formState.errors.materia_id.message}</div>
                )}
                {form.watch("entidad_id") && materiasFiltradas.length === 0 && (
                  <div className="text-xs text-destructive">
                    No hay materias registradas para esta entidad educativa.
                    <Link href="/dashboard/subjects" className="ml-1 text-primary hover:underline">
                      Crear materia
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Periodo Escolar</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Fecha Inicio</Label>
                    <div className="flex gap-2">
                      <Select
                        value={startDate ? startDate.getMonth().toString() : ""}
                        onValueChange={(value) => {
                          if (startDate) {
                            handleStartDateChange(parseInt(value), startDate.getFullYear());
                          } else {
                            handleStartDateChange(parseInt(value), new Date().getFullYear());
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px] bg-white dark:bg-[#1E1E1F]">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={startDate ? startDate.getFullYear().toString() : ""}
                        onValueChange={(value) => {
                          handleStartDateChange(
                            startDate ? startDate.getMonth() : 0,
                            parseInt(value)
                          );
                        }}
                      >
                        <SelectTrigger className="w-[100px] bg-white dark:bg-[#1E1E1F]">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Fecha Fin</Label>
                    <div className="flex gap-2">
                      <Select
                        value={endDate ? endDate.getMonth().toString() : ""}
                        onValueChange={(value) => {
                          if (endDate) {
                            handleEndDateChange(parseInt(value), endDate.getFullYear());
                          } else {
                            handleEndDateChange(parseInt(value), new Date().getFullYear());
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px] bg-white dark:bg-[#1E1E1F]">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={endDate ? endDate.getFullYear().toString() : ""}
                        onValueChange={(value) => {
                          handleEndDateChange(
                            endDate ? endDate.getMonth() : 0,
                            parseInt(value)
                          );
                        }}
                      >
                        <SelectTrigger className="w-[100px] bg-white dark:bg-[#1E1E1F]">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {form.watch("periodo_escolar") && (
                  <div className="text-sm text-muted-foreground">
                    Periodo interpretado: {form.watch("periodo_escolar")}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Información adicional sobre el grupo"
                  className="bg-white dark:bg-[#1E1E1F]"
                  {...form.register("descripcion")}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={materias.length === 0}>
                  {editingGrupo ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}