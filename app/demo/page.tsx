'use client';

import { useState } from 'react';
import { OMRForm, MultipleChoiceOptions } from '@/components/exam';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DemoPage() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({
    1: 'A', 
    2: 'B',
    5: 'C',
    10: 'D'
  });
  
  const [disabledQuestions, setDisabledQuestions] = useState<number[]>([3, 6, 9]);
  
  const handleAnswerChange = (questionNumber: number, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionNumber]: option
    }));
  };
  
  const handleToggleDisabled = (questionNumber: number) => {
    setDisabledQuestions(prev => {
      if (prev.includes(questionNumber)) {
        return prev.filter(q => q !== questionNumber);
      } else {
        return [...prev, questionNumber];
      }
    });
  };
  
  const handleClearAnswers = () => {
    setSelectedAnswers({});
  };
  
  const handleRandomAnswers = () => {
    const options = ['A', 'B', 'C', 'D'];
    const newAnswers: Record<number, string> = {};
    
    for (let i = 1; i <= 40; i++) {
      if (Math.random() > 0.3 && !disabledQuestions.includes(i)) {
        const randomOption = options[Math.floor(Math.random() * options.length)];
        newAnswers[i] = randomOption;
      }
    }
    
    setSelectedAnswers(newAnswers);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Componentes de Examen</h1>
      
      <Tabs defaultValue="omr-form">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="omr-form">Hoja de Respuestas (OMR)</TabsTrigger>
          <TabsTrigger value="multiple-choice">Opciones Múltiples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="omr-form" className="space-y-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hoja de Respuestas OMR</CardTitle>
              <CardDescription>
                Componente para mostrar y editar hojas de respuestas de opción múltiple
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <Button onClick={handleRandomAnswers} variant="outline">Generar Respuestas Aleatorias</Button>
                <Button onClick={handleClearAnswers} variant="outline">Limpiar Respuestas</Button>
              </div>
              
              <OMRForm
                title="Examen de Demostración"
                numQuestions={40}
                numOptions={4}
                questionsPerColumn={20}
                selectedAnswers={selectedAnswers}
                disabledQuestions={disabledQuestions}
                editable={true}
                onAnswerChange={handleAnswerChange}
              />
              
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Estado Actual</h3>
                <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto max-h-60">
                  {JSON.stringify({ selectedAnswers, disabledQuestions }, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="multiple-choice" className="space-y-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Componente de Opciones Múltiples</CardTitle>
              <CardDescription>
                Variaciones del componente base para opciones múltiples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-medium">Tamaños</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">Pequeño:</span>
                      <MultipleChoiceOptions
                        selectedOption="A"
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">Mediano:</span>
                      <MultipleChoiceOptions
                        selectedOption="B"
                        size="md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">Grande:</span>
                      <MultipleChoiceOptions
                        selectedOption="C"
                        size="lg"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-medium">Estados</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Normal:</span>
                      <MultipleChoiceOptions
                        selectedOption="A"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Deshabilitado:</span>
                      <MultipleChoiceOptions
                        selectedOption="B"
                        disabled={true}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Con número:</span>
                      <MultipleChoiceOptions
                        selectedOption="C"
                        questionNumber={15}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Interactivo:</span>
                      <MultipleChoiceOptions
                        selectedOption={selectedAnswers[42] || '-'}
                        readOnly={false}
                        onSelect={(option) => handleAnswerChange(42, option)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-medium">Número de Opciones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">4 opciones:</span>
                      <MultipleChoiceOptions
                        selectedOption="C"
                        numOptions={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">5 opciones:</span>
                      <MultipleChoiceOptions
                        selectedOption="D"
                        numOptions={5}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-sm">6 opciones:</span>
                      <MultipleChoiceOptions
                        selectedOption="E"
                        numOptions={6}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 border rounded-lg p-4">
                  <h3 className="font-medium">Variaciones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Con etiquetas:</span>
                      <MultipleChoiceOptions
                        selectedOption="A"
                        showLabels={true}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Sin selección:</span>
                      <MultipleChoiceOptions
                        selectedOption="-"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24 text-sm">Personalizado:</span>
                      <MultipleChoiceOptions
                        selectedOption="B"
                        className="bg-slate-50 p-2 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 