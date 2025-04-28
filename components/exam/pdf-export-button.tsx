'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, Check, X } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, Image, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabase/client';

// Define specific types for the data
interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
}

interface RespuestaEstudiante {
  id: string;
  pregunta: {
    orden: number;
  };
  opcion_respuesta: {
    orden: number;
  };
  es_correcta: boolean;
}

interface ResultadoExamen {
  id: string;
  estudiante: Estudiante;
  puntaje_obtenido: number;
  porcentaje: number;
  respuestas_estudiante: RespuestaEstudiante[];
  imagenBase64?: string;
}

interface ExamDetails {
  materias?: {
    nombre: string;
  };
  grupos?: {
    nombre: string;
  };
  materia_id?: string;
}

// Types for the component
interface PDFExportButtonProps {
  resultados: ResultadoExamen[];
  examDetails: ExamDetails | null;
  fileName: string;
  buttonText?: string;
  onPrepare: (_updateProgress: (_progress: number) => void) => Promise<void>;
  className?: string;
  totalPreguntas?: number;
}

// Styles for the PDF
const styles = StyleSheet.create({
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
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomColor: '#EEEEEE',
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
  },
  studentInfo: {
    marginBottom: 20,
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
  answersGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  answersHeader: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  answerItem: {
    width: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    width: 30,
    fontSize: 12,
    fontWeight: 'bold',
  },
  answerLetter: {
    fontSize: 12,
    marginRight: 4,
  },
  indicator: {
    fontSize: 12,
    marginLeft: 4,
  },
  image: {
    marginTop: 20,
    width: '100%',
    height: 350,
    objectFit: 'contain',
  },
});

// Constante para las letras de las opciones
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// PDF Document Component
const ExamPDF = ({ resultados, examDetails, institucionNombre, totalPreguntas = 0 }: { 
  resultados: ResultadoExamen[]; 
  examDetails: ExamDetails | null; 
  institucionNombre: string;
  totalPreguntas: number;
}) => {
  return (
    <Document>
      {resultados.map((resultado) => (
        <Page key={resultado.id} size="A4" style={styles.page}>
          <Text style={styles.header}>{institucionNombre}</Text>
          
          <View style={styles.studentInfo}>
            <View style={styles.row}>
              <Text style={styles.label}>Materia:</Text>
              <Text style={styles.value}>{examDetails?.materias?.nombre || 'Sin materia'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Grupo:</Text>
              <Text style={styles.value}>{examDetails?.grupos?.nombre || 'Sin grupo'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Identificacion Estudiante:</Text>
              <Text style={styles.value}>{resultado.estudiante.identificacion}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nota:</Text>
              <Text style={styles.value}>{resultado.puntaje_obtenido.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Porcentaje:</Text>
              <Text style={styles.value}>{resultado.porcentaje.toFixed(1)}%</Text>
            </View>
          </View>
          
          <Text style={styles.answersHeader}>Respuestas Detectadas</Text>
          <View style={styles.answersGrid}>
            {/* Generar un array con todas las preguntas de 1 a totalPreguntas */}
            {Array.from({ length: Math.max(totalPreguntas, 
              ...resultado.respuestas_estudiante.map(r => r.pregunta.orden)) }, 
              (_, i) => i + 1)
              .map((ordenPregunta) => {
                // Buscar si existe respuesta para esta pregunta
                const respuesta = resultado.respuestas_estudiante
                  .find(r => r.pregunta.orden === ordenPregunta);
                
                if (respuesta) {
                  // Si hay respuesta, mostrarla normalmente
                  return (
                    <View key={`pregunta-${ordenPregunta}`} style={styles.answerItem}>
                      <Text style={styles.questionNumber}>{ordenPregunta}.</Text>
                      <Text style={styles.answerLetter}>
                        {OPTION_LETTERS[respuesta.opcion_respuesta.orden - 1]}
                      </Text>
                      <Text style={styles.indicator}>
                        {respuesta.es_correcta ? '(Correcta)' : '(Incorrecta)'}
                      </Text>
                    </View>
                  );
                } else {
                  // Si no hay respuesta, mostrar N/A e Incorrecta
                  return (
                    <View key={`pregunta-sin-respuesta-${ordenPregunta}`} style={styles.answerItem}>
                      <Text style={styles.questionNumber}>{ordenPregunta}.</Text>
                      <Text style={styles.answerLetter}>
                        N/A
                      </Text>
                      <Text style={styles.indicator}>
                        (Incorrecta)
                      </Text>
                    </View>
                  );
                }
              })}
          </View>

          {resultado.imagenBase64 && (
            /* eslint-disable-next-line jsx-a11y/alt-text */
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

// The exported button component
export function PDFExportButton({ 
  resultados, 
  examDetails, 
  fileName, 
  buttonText = 'Reporte en PDF', 
  onPrepare, 
  className,
  totalPreguntas = 0 
}: PDFExportButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [institucionNombre, setInstitucionNombre] = useState('INSTITUCIÓN ACADÉMICA');

  // Make sure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setHasError(false);
      setProgress(0);
    }
  }, [isOpen]);

  const handlePrepare = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setIsPrepared(false);
    setHasError(false);
    setProgress(0);

    try {
      // Use the real progress updates from image loading
      await onPrepare((newProgress) => {
        setProgress(newProgress);
      });

      // For debugging - log the examDetails structure
      logger.log("examDetails:", examDetails);
      logger.log("Available exam data fields:", Object.keys(examDetails || {}));
      
      // Get the institution name from the database
      if (examDetails?.materia_id) {
        try {
          const { data, error } = await supabase
            .from('materias')
            .select('entidad_id, entidades_educativas:entidad_id(nombre)')
            .eq('id', examDetails.materia_id)
            .single();
            
          if (data && !error) {
            // Correctly access the nested Join result
            const nombre = data.entidades_educativas?.nombre;
            if (nombre) {
              setInstitucionNombre(nombre);
              logger.log("Institution name found:", nombre);
            }
          } else {
            logger.error("Error fetching institution name:", error);
          }
        } catch (err) {
          logger.error("Error in Supabase query:", err);
        }
      }

      // Set to 100% when complete
      setProgress(100);
      setIsPrepared(true);
    } catch (error) {
      logger.error('Error preparing PDF:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isClient) {
    return (
      <Button 
        disabled 
        variant="secondary"
        className="flex items-center"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="default"
        className="flex items-center"
        onClick={handlePrepare}
      >
        <FileText className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isLoading ? 'Generando PDF' : 
               isPrepared ? 'PDF listo para descargar' : 
               hasError ? 'Error al generar el PDF' : 'Generando PDF'}
            </DialogTitle>
            <DialogDescription>
              {isLoading ? 'Preparando la información y cargando imágenes...' : 
               isPrepared ? 'El PDF ha sido generado correctamente y está listo para descargar.' : 
               hasError ? 'Ocurrió un error al preparar el PDF. Por favor, intente nuevamente.' : 
               'Preparando documento PDF...'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isLoading && (
              <div className="space-y-6">
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Cargando imágenes...</span>
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
                  <span className="text-sm font-medium">PDF generado correctamente</span>
                </div>
                
                <div className="flex justify-center mt-4">
                  <PDFDownloadLink 
                    document={<ExamPDF resultados={resultados} examDetails={examDetails} institucionNombre={institucionNombre} totalPreguntas={totalPreguntas} />} 
                    fileName={fileName}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
                      "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-10 px-6 py-2 w-full sm:w-auto",
                      className
                    )}
                  >
                    {({ loading }) => 
                      loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Preparando PDF...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </>
                      )
                    }
                  </PDFDownloadLink>
                </div>
              </div>
            )}

            {hasError && (
              <div className="flex items-center justify-center gap-3 py-6">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium">No se pudo generar el PDF</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
            >
              Cerrar
            </Button>
            
            {hasError && (
              <Button 
                variant="default" 
                onClick={handlePrepare}
              >
                Reintentar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 