import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { AnswerBubblesGrid } from '../shared/answer-bubbles-grid';
import { ImageWithSignedUrl } from '../shared/image-with-signed-url';
import type { ResultadoExamen, RespuestaEstudiante } from '../utils/types';

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  resultado: ResultadoExamen | null;
  totalPreguntas: number;
  onBubbleClick: (_respuesta: RespuestaEstudiante, _opcionOrden: number, _resultadoId: string, _opcionId: string) => void;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
          <DialogDescription>
            {t('modal.description')} {resultado?.estudiante.nombres} {resultado?.estudiante.apellidos}
          </DialogDescription>
        </DialogHeader>

        {resultado && (
          <Tabs defaultValue="answers" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="answers" className="text-xs md:text-sm truncate">{t('modal.responses')}</TabsTrigger>
              <TabsTrigger value="original" className="text-xs md:text-sm truncate">{t('modal.originalImage')}</TabsTrigger>
              <TabsTrigger value="processed" className="text-xs md:text-sm truncate">{t('modal.processedImage')}</TabsTrigger>
            </TabsList>

            <TabsContent value="answers">
              <div className="pt-3">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4 px-2">
                  <div>
                    <p className="text-xs md:text-sm font-mono font-bold">{t('modal.scoreLabel')}: {resultado.puntaje_obtenido.toFixed(2)}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono md:text-right">
                    <span className="block md:inline">{t('modal.totalQuestions')}: {totalPreguntas}</span>
                    <span className="hidden md:inline"> | </span>
                    <span className="block md:inline">{t('modal.validQuestions')}: {resultado.respuestas_estudiante.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <AnswerBubblesGrid
                  respuestas={resultado.respuestas_estudiante}
                  totalPreguntas={totalPreguntas}
                  resultadoId={resultado.id}
                  onBubbleClick={onBubbleClick}
                  readonly={false}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="original">
              {resultado.examen_escaneado?.ruta_s3_original ? (
                <div className="relative w-full max-w-[500px] h-[55vh] border rounded-lg overflow-hidden bg-card dark:bg-card mx-auto flex items-center justify-center">
                  <div className="w-full h-full">
                    <ImageWithSignedUrl
                      path={resultado.examen_escaneado.ruta_s3_original}
                      alt="Imagen original del examen"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('dialogs.noOriginalImage')}
                </div>
              )}
            </TabsContent>

            <TabsContent value="processed">
              {resultado.examen_escaneado?.ruta_s3_procesado ? (
                <div className="relative w-full max-w-[500px] h-[55vh] border rounded-lg overflow-hidden bg-card dark:bg-card mx-auto flex items-center justify-center">
                  <div className="w-full h-full">
                    <ImageWithSignedUrl
                      path={resultado.examen_escaneado.ruta_s3_procesado}
                      alt="Imagen procesada del examen"
                    />
                  </div>
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
