import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { AnswerBubblesGrid } from '../shared/answer-bubbles-grid';
import { ImageWithSignedUrl } from '../shared/image-with-signed-url';
import type { ResultadoExamen, RespuestaEstudiante } from '../utils/types';

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultado: ResultadoExamen | null;
  totalPreguntas: number;
  onBubbleClick: (respuesta: RespuestaEstudiante, opcionOrden: number, resultadoId: string, opcionId: string) => void;
}

export function StudentDetailsDialog({
  open,
  onOpenChange,
  resultado,
  totalPreguntas,
  onBubbleClick
}: StudentDetailsDialogProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
          <DialogDescription>
            {t('modal.description')} {resultado?.estudiante.nombres} {resultado?.estudiante.apellidos}
          </DialogDescription>
        </DialogHeader>

        {resultado && (
          <Tabs defaultValue="answers" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="answers">{t('modal.responses')}</TabsTrigger>
              <TabsTrigger value="original">{t('modal.originalImage')}</TabsTrigger>
              <TabsTrigger value="processed">{t('modal.processedImage')}</TabsTrigger>
            </TabsList>

            <TabsContent value="answers">
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-medium">{t('modal.scoreLabel')}: {resultado.puntaje_obtenido.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('table.percentage')}: {resultado.porcentaje.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('modal.totalQuestions')}: {totalPreguntas} | {t('modal.validQuestions')}: {resultado.respuestas_estudiante.length}
                  </div>
                </div>

                <AnswerBubblesGrid
                  respuestas={resultado.respuestas_estudiante}
                  totalPreguntas={totalPreguntas}
                  resultadoId={resultado.id}
                  onBubbleClick={onBubbleClick}
                  readonly={false}
                />
              </div>
            </TabsContent>

            <TabsContent value="original">
              {resultado.examen_escaneado?.ruta_s3_original ? (
                <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-card dark:bg-card">
                  <ImageWithSignedUrl
                    path={resultado.examen_escaneado.ruta_s3_original}
                    alt="Imagen original del examen"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('dialogs.noOriginalImage')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="processed">
              {resultado.examen_escaneado?.ruta_s3_procesado ? (
                <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-card dark:bg-card">
                  <ImageWithSignedUrl
                    path={resultado.examen_escaneado.ruta_s3_procesado}
                    alt="Imagen procesada del examen"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('dialogs.noProcessedImage')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('dialogs.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
