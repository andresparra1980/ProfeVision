'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

// Moved inside component to access translations

interface Props {
  initialScheme?: GradingScheme;
  groupId: string;
  onSave: (_scheme: GradingScheme) => Promise<void>;
}

export function GradingSchemeEditor({ initialScheme, groupId, onSave }: Props) {
  const t = useTranslations('dashboard.components.gradingSchemeEditor');
  
  const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
    { value: 'examen', label: t('componentTypes.exam') },
    { value: 'proyecto', label: t('componentTypes.project') },
    { value: 'quiz', label: t('componentTypes.quiz') },
    { value: 'trabajo', label: t('componentTypes.work') },
  ];
  
  const [scheme, setScheme] = useState<GradingScheme>(
    initialScheme || {
              grupo_id: groupId,
        nombre: t('defaultSchemeName'),
        fecha_inicio: '',
        fecha_fin: '',
        periodos: [
          {
            nombre: t('defaultPeriodName'),
            porcentaje: 0,
            orden: 0,
            esquema_id: '',
            fecha_inicio: '',
            fecha_fin: '',
            componentes: [
              {
                nombre: t('defaultComponentName'),
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

      // Si faltan fechas en el esquema, intentar extraerlas de los periodos
      const updatedScheme = { ...scheme };
      if (!scheme.fecha_inicio || !scheme.fecha_fin) {
        const periodosOrdenados = [...scheme.periodos].sort((a, b) => a.orden - b.orden);
        if (periodosOrdenados.length > 0) {
          if (!scheme.fecha_inicio) {
            updatedScheme.fecha_inicio = periodosOrdenados[0].fecha_inicio;
          }
          if (!scheme.fecha_fin) {
            updatedScheme.fecha_fin = periodosOrdenados[periodosOrdenados.length - 1].fecha_fin;
          }
        }
      }

      // Validar que las fechas estén establecidas
      if (!updatedScheme.fecha_inicio || !updatedScheme.fecha_fin) {
        toast({
          title: t('error.title'),
          description: t('error.missingDates'),
          variant: 'destructive',
        });
        return;
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (new Date(updatedScheme.fecha_fin) <= new Date(updatedScheme.fecha_inicio)) {
        toast({
          title: t('error.title'),
          description: t('error.invalidDates'),
          variant: 'destructive',
        });
        return;
      }
      
      // Validar que los porcentajes de los periodos sumen 100%
      const periodosTotal = updatedScheme.periodos.reduce((sum, p) => sum + p.porcentaje, 0);
      if (Math.abs(periodosTotal - 100) > 0.01) {
        toast({
          title: t('error.title'),
          description: t('error.periodsSum'),
          variant: 'destructive',
        });
        return;
      }

      // Validar que los componentes de cada periodo sumen el porcentaje del periodo
      for (const periodo of updatedScheme.periodos) {
        const componentesTotal = periodo.componentes.reduce((sum, c) => sum + c.porcentaje, 0);
        if (Math.abs(componentesTotal - periodo.porcentaje) > 0.01) {
          toast({
            title: t('error.title'),
            description: `${t('error.componentsSum')} "${periodo.nombre}" ${t('error.componentsSumValue')} ${periodo.porcentaje}%`,
            variant: 'destructive',
          });
          return;
        }
      }

      await onSave(updatedScheme);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({
        title: t('error.title'),
        description: t('error.saving'),
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
      nombre: `${t('period')} ${scheme.periodos.length + 1}`,
      porcentaje: 0,
      orden: scheme.periodos.length,
      esquema_id: scheme.id || '',
      fecha_inicio: scheme.fecha_inicio,
      fecha_fin: scheme.fecha_fin,
      componentes: [
        {
          nombre: t('newComponent'),
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
      nombre: t('newComponent'),
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
              <Label htmlFor="scheme-name">{t('schemeName')}</Label>
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
                              <Label htmlFor={`periodo-fecha-inicio-${periodIndex}`} className="text-sm">{t('startDate')}</Label>
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
                              <Label htmlFor={`periodo-fecha-fin-${periodIndex}`} className="text-sm">{t('endDate')}</Label>
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
                                    <SelectValue placeholder={t('type')} />
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
                            {t('addComponent')}
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
          {t('addPeriod')}
        </Button>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
} 