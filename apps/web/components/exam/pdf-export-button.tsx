'use client';

import { useMemo, useState } from 'react';
import { FileText, Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
// NOTE: We lazy-load @react-pdf/renderer to avoid HMR issues with fontkit/@swc/helpers
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logger from '@/lib/utils/logger';
import { toast } from 'sonner';

// Types for the component
interface Estudiante {
  id: string;
  identificacion: string;
  nombre?: string;
  apellido?: string;
}

interface OpcionRespuesta {
  id: string;
  orden: number;
  texto?: string;
  es_correcta?: boolean;
}

interface RespuestaEstudiante {
  id: string;
  pregunta_id: string;
  opcion_id: string;
  es_correcta: boolean;
  puntaje_obtenido: number;
  pregunta: {
    id: string;
    orden: number;
    num_opciones: number;
    habilitada: boolean;
    opciones_respuesta: OpcionRespuesta[];
  };
  opcion_respuesta: {
    id: string;
    orden: number;
  };
}

interface ResultadoExamen {
  id: string;
  estudiante: Estudiante;
  puntaje_obtenido: number;
  porcentaje: number;
  fecha_calificacion: string;
  respuestas_estudiante: RespuestaEstudiante[];
  examen_escaneado?: {
    archivo_original: string;
    archivo_procesado: string;
    ruta_s3_original: string;
    ruta_s3_procesado: string;
  };
  imagenBase64?: string;
}

interface ExamDetails {
  id: string;
  titulo?: string;
  materias?: {
    nombre: string;
    entidades_educativas?: {
      nombre: string;
    };
  };
  grupos?: {
    id: string;
    nombre: string;
  };
}

interface ImageResponse {
  resultId: string;
  imagenBase64: string | null;
}

interface PDFExportButtonProps {
  examId?: string;
  groupId?: string | null;
  fileName: string;
  buttonText?: string;
  resultados: ResultadoExamen[];
  examDetails: ExamDetails | null;
}

// Styles are memoized once the PDF lib is loaded

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// The exported button component
export function PDFExportButton({
  examId: providedExamId,
  groupId,
  fileName,
  buttonText = 'Reporte en PDF',
  resultados,
  examDetails
}: PDFExportButtonProps) {
  const params = useParams();
  const examId = providedExamId || (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '');

  const [isOpen, setIsOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [resultadosWithImages, setResultadosWithImages] = useState<ResultadoExamen[]>([]);
  const [institucionNombre, setInstitucionNombre] = useState('INSTITUCIÓN ACADÉMICA');
  const [pdfLib, setPdfLib] = useState<null | typeof import('@react-pdf/renderer')>(null);
  const t = useTranslations('dashboard.exams.results.pdfExport');

  const visibleQuestionNumbers = useMemo(() => {
    const enabledQuestionNumbers = new Set(
      resultados.flatMap((resultado) =>
        (resultado.respuestas_estudiante || [])
          .filter((respuesta) => respuesta?.pregunta?.habilitada)
          .map((respuesta) => respuesta.pregunta.orden)
      )
    );

    return Array.from(enabledQuestionNumbers).sort((a, b) => a - b);
  }, [resultados]);

  const styles = useMemo(() => {
    if (!pdfLib) return null as unknown as Record<string, never>;
    return pdfLib.StyleSheet.create({
      page: {
        padding: 30,
        backgroundColor: '#ffffff',
      },
      header: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
      },
      studentInfo: {
        marginBottom: 20,
      },
      row: {
        flexDirection: 'row',
        borderBottomColor: '#EEEEEE',
        borderBottomWidth: 1,
        alignItems: 'center',
        paddingTop: 5,
        paddingBottom: 5,
      },
      label: {
        width: 150,
        fontSize: 12,
        fontWeight: 'bold',
      },
      value: {
        flex: 1,
        fontSize: 12,
      },
      answersHeader: {
        fontSize: 13,
        marginBottom: 8,
        marginTop: 10,
        fontWeight: 'bold',
      },
      answersGrid: {
        marginTop: 15,
        marginBottom: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      answerItem: {
        width: '20%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
      },
      questionNumber: {
        width: 25,
        fontSize: 11,
        fontWeight: 'bold',
      },
      answerLetter: {
        fontSize: 11,
        marginRight: 3,
      },
      indicator: {
        fontSize: 10,
        marginLeft: 3,
      },
      image: {
        marginTop: 20,
        width: '100%',
        height: 350,
        objectFit: 'contain',
      },
    });
  }, [pdfLib]);

  const handlePrepare = async () => {
    if (!examId) {
      toast.error('Error', { description: 'No exam ID provided' });
      return;
    }

    setIsOpen(true);
    setIsPreparing(true);
    setIsPrepared(false);
    setHasError(false);
    setErrorMessage('');
    setProgress(0);

    try {
      // Fetch optimized images from server
      const queryParams = new URLSearchParams();
      if (groupId) {
        queryParams.append('groupId', groupId);
      }

      setProgress(20);
      logger.log('Fetching optimized images...');

      const response = await fetch(`/api/exams/${examId}/results/images?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; images: ImageResponse[] };
      setProgress(60);

      logger.log('Images fetched:', data.images?.length || 0);

      // Merge images with results
      const imagesMap = new Map(data.images?.map((img) => [img.resultId, img.imagenBase64]) || []);

      const merged = resultados.map(resultado => ({
        ...resultado,
        imagenBase64: imagesMap.get(resultado.id) || undefined
      }));

      setResultadosWithImages(merged);
      setProgress(80);

      // Get institution name
      setInstitucionNombre(
        examDetails?.materias?.entidades_educativas?.nombre ||
        'INSTITUCIÓN ACADÉMICA'
      );

      // Lazy-load PDF library right before enabling download UI
      const lib = await import('@react-pdf/renderer');
      setPdfLib(lib);

      setProgress(100);
      setIsPrepared(true);

      toast.success(t('pdfGeneratedSuccess'), {
        description: t('pdfGeneratedCorrectly')
      });

    } catch (error) {
      logger.error('Error preparing PDF:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');

      toast.error(t('generationError'), {
        description: error instanceof Error ? error.message : t('errorOccurred')
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleClose = () => {
    if (!isPreparing) {
      setIsOpen(false);
      setIsPrepared(false);
      setHasError(false);
      setErrorMessage('');
      setProgress(0);
    }
  };

  const RenderedExamPDF = () => {
    if (!pdfLib || !styles) return null;
    const { Document, Page, Text, View, Image } = pdfLib;
    return (
      <Document>
        {resultadosWithImages.map((resultado) => (
          <Page key={resultado.id} size="A4" style={styles.page}>
            <Text style={styles.header}>{institucionNombre}</Text>

            <View style={styles.studentInfo}>
              <View style={styles.row}>
                <Text style={styles.label}>{t('content.subject')}</Text>
                <Text style={styles.value}>{examDetails?.materias?.nombre || t('content.noSubject')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('content.group')}</Text>
                <Text style={styles.value}>{examDetails?.grupos?.nombre || t('content.noGroup')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('content.studentIdentification')}</Text>
                <Text style={styles.value}>{resultado.estudiante?.identificacion || t('content.notAvailable')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('content.score')}</Text>
                <Text style={styles.value}>{(resultado.puntaje_obtenido || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('content.percentage')}</Text>
                <Text style={styles.value}>{(resultado.porcentaje || 0).toFixed(1)}%</Text>
              </View>
            </View>

          <Text style={styles.answersHeader}>{t('content.detectedAnswers')}</Text>
          <View style={styles.answersGrid}>
            {visibleQuestionNumbers.map((ordenPregunta) => {
              const respuesta = (resultado.respuestas_estudiante || []).find(
                (r) => r?.pregunta?.orden === ordenPregunta && r.pregunta.habilitada
              );

              if (respuesta && respuesta.opcion_respuesta) {
                return (
                  <View key={`pregunta-${ordenPregunta}`} style={styles.answerItem}>
                    <Text style={styles.questionNumber}>{ordenPregunta}.</Text>
                    <Text style={styles.answerLetter}>
                      {OPTION_LETTERS[respuesta.opcion_respuesta.orden - 1]}
                    </Text>
                    <Text style={styles.indicator}>
                      {respuesta.es_correcta ? t('content.correct') : t('content.incorrect')}
                    </Text>
                  </View>
                );
              } else {
                return (
                  <View key={`pregunta-sin-respuesta-${ordenPregunta}`} style={styles.answerItem}>
                    <Text style={styles.questionNumber}>{ordenPregunta}.</Text>
                    <Text style={styles.answerLetter}>{t('content.notAvailable')}</Text>
                    <Text style={styles.indicator}>{t('content.incorrect')}</Text>
                  </View>
                );
              }
            })}
          </View>

          {resultado.imagenBase64 && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              src={`data:image/png;base64,${resultado.imagenBase64}`}
              style={styles.image}
            />
          )}
        </Page>
      ))}
      </Document>
    );
  };

  return (
    <>
      <Button
        variant="secondary"
        className="flex items-center w-full sm:w-auto bg-secondary text-primary-foreground dark:bg-secondary dark:text-white transition-colors"
        onClick={handlePrepare}
      >
        <FileText className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPreparing ? t('generatingPDF') :
               isPrepared ? t('pdfReady') :
               hasError ? t('generationError') : t('generatingPDF')}
            </DialogTitle>
            <DialogDescription>
              {isPreparing ? t('preparingInfo') :
               isPrepared ? t('pdfGeneratedSuccess') :
               hasError ? (errorMessage || t('errorOccurred')) :
               t('preparingDocument')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isPreparing && (
              <div className="space-y-6">
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('loadingImages')}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            {isPrepared && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{t('pdfGeneratedCorrectly')}</span>
                </div>

                <div className="flex justify-center mt-4">
                  {pdfLib ? (
                    <pdfLib.PDFDownloadLink
                      document={<RenderedExamPDF />}
                      fileName={fileName}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-10 px-6 py-2 w-full sm:w-auto"
                    >
                      {({ loading }: { loading: boolean }) =>
                        loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('preparingPDF')}
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            {t('downloadPDF')}
                          </>
                        )
                      }
                    </pdfLib.PDFDownloadLink>
                  ) : (
                    <div className="inline-flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('preparingPDF')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasError && (
              <div className="flex items-center justify-center gap-3 py-6">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium">{t('couldNotGenerate')}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPreparing}
            >
              {t('close')}
            </Button>

            {hasError && (
              <Button
                variant="default"
                onClick={handlePrepare}
                disabled={isPreparing}
              >
                {t('retry')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
