'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { GradingScheme, GradingPeriod, GradingComponent, ComponentType } from '@/lib/types/grading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
  { value: 'examen', label: 'Examen' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'trabajo', label: 'Trabajo' },
];

interface Props {
  initialScheme?: GradingScheme;
  groupId: string;
  onSave: (_scheme: GradingScheme) => Promise<void>;
}

export function GradingSchemeEditor({ initialScheme, groupId, onSave }: Props) {
  const [scheme, setScheme] = useState<GradingScheme>(
    initialScheme || {
      grupo_id: groupId,
      nombre: 'Esquema de Calificación',
      fecha_inicio: '',
      fecha_fin: '',
      periodos: [
        {
          nombre: 'Primer Periodo',
          porcentaje: 0,
          orden: 0,
          esquema_id: '',
          fecha_inicio: '',
          fecha_fin: '',
          componentes: [
            {
              nombre: 'Tareas',
              porcentaje: 0,
              periodo_id: '',
              tipo: 'trabajo',
            },
          ],
        },
      ],
    }
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validar que las fechas estén establecidas
      if (!scheme.fecha_inicio || !scheme.fecha_fin) {
        toast({
          title: 'Error',
          description: 'Debes establecer las fechas de inicio y fin del esquema',
          variant: 'destructive',
        });
        return;
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (new Date(scheme.fecha_fin) <= new Date(scheme.fecha_inicio)) {
        toast({
          title: 'Error',
          description: 'La fecha de fin debe ser posterior a la fecha de inicio',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar que los porcentajes de los periodos sumen 100%
      const periodosTotal = scheme.periodos.reduce((sum, p) => sum + p.porcentaje, 0);
      if (Math.abs(periodosTotal - 100) > 0.01) {
        toast({
          title: 'Error',
          description: 'Los porcentajes de los periodos deben sumar 100%',
          variant: 'destructive',
        });
        return;
      }

      // Validar que los componentes de cada periodo sumen el porcentaje del periodo
      for (const periodo of scheme.periodos) {
        const componentesTotal = periodo.componentes.reduce((sum, c) => sum + c.porcentaje, 0);
        if (Math.abs(componentesTotal - periodo.porcentaje) > 0.01) {
          toast({
            title: 'Error',
            description: `Los porcentajes de los componentes en el periodo "${periodo.nombre}" deben sumar ${periodo.porcentaje}%`,
            variant: 'destructive',
          });
          return;
        }
      }

      await onSave(scheme);
      toast({
        title: 'Éxito',
        description: 'Esquema de calificaciones guardado correctamente',
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el esquema de calificaciones',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePeriodDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(scheme.periodos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar orden
    const updatedItems = items.map((item, index) => ({
      ...item,
      orden: index,
    }));

    setScheme({
      ...scheme,
      periodos: updatedItems,
    });
  };

  const addPeriod = () => {
    const newPeriod: GradingPeriod = {
      nombre: `Periodo ${scheme.periodos.length + 1}`,
      porcentaje: 0,
      orden: scheme.periodos.length,
      esquema_id: scheme.id || '',
      fecha_inicio: scheme.fecha_inicio,
      fecha_fin: scheme.fecha_fin,
      componentes: [
        {
          nombre: 'Nuevo Componente',
          porcentaje: 0,
          periodo_id: '',
          tipo: 'examen',
        },
      ],
    };

    setScheme({
      ...scheme,
      periodos: [...scheme.periodos, newPeriod],
    });
  };

  const removePeriod = (index: number) => {
    const updatedPeriods = scheme.periodos.filter((_, i) => i !== index);
    setScheme({
      ...scheme,
      periodos: updatedPeriods,
    });
  };

  const updatePeriod = (index: number, field: keyof GradingPeriod, value: string | number | GradingComponent[]) => {
    const updatedPeriods = [...scheme.periodos];
    updatedPeriods[index] = {
      ...updatedPeriods[index],
      [field]: value,
    };
    setScheme({
      ...scheme,
      periodos: updatedPeriods,
    });
  };

  const addComponent = (periodIndex: number) => {
    const updatedPeriods = [...scheme.periodos];
    const period = updatedPeriods[periodIndex];
    
    period.componentes.push({
      nombre: `Nuevo Componente`,
      porcentaje: 0,
      periodo_id: period.id || '',
      tipo: 'examen',
    });

    setScheme({
      ...scheme,
      periodos: updatedPeriods,
    });
  };

  const removeComponent = (periodIndex: number, componentIndex: number) => {
    const updatedPeriods = [...scheme.periodos];
    updatedPeriods[periodIndex].componentes = updatedPeriods[periodIndex].componentes.filter(
      (_, i) => i !== componentIndex
    );
    setScheme({
      ...scheme,
      periodos: updatedPeriods,
    });
  };

  const updateComponent = (
    periodIndex: number,
    componentIndex: number,
    field: keyof GradingComponent,
    value: string | number | ComponentType
  ) => {
    const updatedPeriods = [...scheme.periodos];
    const component = updatedPeriods[periodIndex].componentes[componentIndex];
    updatedPeriods[periodIndex].componentes[componentIndex] = {
      ...component,
      [field]: value,
    };
    setScheme({
      ...scheme,
      periodos: updatedPeriods,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 w-full">
              <Label htmlFor="scheme-name">Nombre del Esquema</Label>
              <Input
                id="scheme-name"
                value={scheme.nombre}
                onChange={(e) => setScheme({ ...scheme, nombre: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <DragDropContext onDragEnd={handlePeriodDragEnd}>
          <Droppable droppableId="periodos">
            {(provided: DroppableProvided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                {scheme.periodos.map((periodo, periodIndex) => (
                  <Draggable
                    key={periodo.id || `new-${periodIndex}`}
                    draggableId={periodo.id || `new-${periodIndex}`}
                    index={periodIndex}
                  >
                    {(provided: DraggableProvided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative p-1 border-2 bg-card dark:bg-card shadow-sm"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-gray-400"
                        >
                          <GripVertical size={20} />
                        </div>

                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">
                              <Input
                                value={periodo.nombre}
                                onChange={(e) =>
                                  updatePeriod(periodIndex, 'nombre', e.target.value)
                                }
                                className="max-w-xs"
                              />
                            </CardTitle>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={periodo.porcentaje}
                                  onChange={(e) =>
                                    updatePeriod(periodIndex, 'porcentaje', parseFloat(e.target.value))
                                  }
                                  className="w-20"
                                />
                                <span>%</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePeriod(periodIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2">
                            <div className="flex-1">
                              <Label htmlFor={`periodo-fecha-inicio-${periodIndex}`} className="text-sm">Fecha inicio</Label>
                              <Input
                                id={`periodo-fecha-inicio-${periodIndex}`}
                                type="date"
                                value={periodo.fecha_inicio}
                                onChange={(e) =>
                                  updatePeriod(periodIndex, 'fecha_inicio', e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={`periodo-fecha-fin-${periodIndex}`} className="text-sm">Fecha fin</Label>
                              <Input
                                id={`periodo-fecha-fin-${periodIndex}`}
                                type="date"
                                value={periodo.fecha_fin}
                                onChange={(e) =>
                                  updatePeriod(periodIndex, 'fecha_fin', e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <Separator />
                          
                          <div className="space-y-4">
                            {periodo.componentes.map((componente, componentIndex) => (
                              <div
                                key={componente.id || `new-${componentIndex}`}
                                className="flex items-center gap-4"
                              >
                                <Input
                                  value={componente.nombre}
                                  onChange={(e) =>
                                    updateComponent(
                                      periodIndex,
                                      componentIndex,
                                      'nombre',
                                      e.target.value
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Select
                                  value={componente.tipo}
                                  onValueChange={(value: ComponentType) =>
                                    updateComponent(
                                      periodIndex,
                                      componentIndex,
                                      'tipo',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COMPONENT_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={componente.porcentaje}
                                    onChange={(e) =>
                                      updateComponent(
                                        periodIndex,
                                        componentIndex,
                                        'porcentaje',
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    className="w-20"
                                  />
                                  <span>%</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeComponent(periodIndex, componentIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => addComponent(periodIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Componente
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => addPeriod()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Periodo
        </Button>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
} 