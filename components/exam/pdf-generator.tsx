"use client";

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
}

interface Group {
  id: string;
  nombre: string;
  materia: {
    nombre: string;
  };
  estudiantes: Student[];
}

interface Exam {
  id: string;
  titulo: string;
  descripcion?: string;
  duracion_minutos: number;
  preguntas: Array<{
    id: string;
    texto: string;
    opciones_respuesta: Array<{
      id: string;
      texto: string;
    }>;
    puntaje: number;
  }>;
}

// Labels for i18n support (react-pdf doesn't support hooks inside Document)
export interface AnswerSheetLabels {
  title: string;
  studentInfo: string;
  name: string;
  identification: string;
  group: string;
  subject: string;
  exam: string;
  duration: string;
  minutes: string;
  pageOf: string;
  instructions: string;
  loading: string;
  downloadPdf: string;
}

interface PDFGeneratorProps {
  exam: Exam;
  group: Group;
  paperSize: 'LETTER' | 'A4';
  fileName: string;
  onGenerated?: () => void;
  labels: AnswerSheetLabels;
}

// Cache for generated PDFs to avoid regeneration
const pdfCache = new Map<string, string>();

function getCacheKey(examId: string, groupId: string): string {
  return `${examId}-${groupId}`;
}

export function PDFGenerator({ exam, group, paperSize, fileName, onGenerated, labels }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('dashboard.exams.results.pdfExport');

  // Memoize sorted students
  const sortedStudents = useMemo(() => 
    [...group.estudiantes].sort((a, b) => 
      a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' })
    ),
    [group.estudiantes]
  );

  // Check cache on mount/group change
  const cacheKey = getCacheKey(exam.id, group.id);
  
  // Generate PDF on demand (not automatically)
  const generatePDF = useCallback(async () => {
    // Check cache first
    const cached = pdfCache.get(cacheKey);
    if (cached) {
      setPdfUrl(cached);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Dynamic import to avoid loading react-pdf until needed
      const [
        { Document, Page, Text, View, StyleSheet, Circle, Svg, Path, Image, pdf },
        { generateLMarkerPath, calculateMarkerDimensions, generateMarkerContainerStyle },
        { generateOptimizedQRCode, generateOptimizedQRData }
      ] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/utils/corner-markers'),
        import('@/lib/utils/qr-code')
      ]);

      // Pre-generate all QR codes in parallel (big optimization)
      const qrDataPromises = sortedStudents.map(async (student) => {
        const qrData = generateOptimizedQRData({
          examId: exam.id,
          studentId: student.id,
          groupId: group.id
        });
        const qrDataUrl = await generateOptimizedQRCode(qrData);
        return { studentId: student.id, qrDataUrl };
      });
      
      const qrResults = await Promise.all(qrDataPromises);
      const qrMap = new Map(qrResults.map(r => [r.studentId, r.qrDataUrl]));

      // Create styles
      const markerDimensions = calculateMarkerDimensions(paperSize);
      const styles = StyleSheet.create({
        page: {
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: 0,
          height: '100%',
        },
        container: {
          margin: markerDimensions.margin * 2,
          minHeight: 720,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        },
        headerSection: {
          padding: '5 10',
          height: 120,
          marginBottom: 8,
        },
        mainTitle: {
          fontSize: 16,
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: 3,
        },
        infoContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: 100,
          paddingTop: 0,
        },
        qrCode: {
          width: 100,
          height: 100,
          marginTop: -8,
          marginLeft: -5,
        },
        studentInfo: {
          width: '65%',
          border: '3pt solid black',
          padding: 8,
        },
        infoTitle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        infoText: {
          fontSize: 8,
          marginBottom: 3,
          lineHeight: 1.2,
        },
        answersSection: {
          padding: 10,
          position: 'relative',
          flexGrow: 1,
          border: '3pt solid black',
          margin: '8 8 15 8',
        },
        columnsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 5,
          flexGrow: 1,
        },
        column: {
          width: '48%',
          borderRight: '1.5pt solid #cccccc',
          paddingRight: 8,
        },
        questionRow: {
          flexDirection: 'row',
          marginBottom: 5,
          alignItems: 'center',
          minHeight: 16,
          borderBottom: '1pt solid #cccccc',
          paddingBottom: 2,
        },
        questionNumberContainer: {
          width: 18,
          height: 18,
          marginRight: 8,
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        questionNumber: {
          fontSize: 8,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        optionsRow: {
          flexDirection: 'row',
          gap: 16,
          flex: 1,
          paddingLeft: 2,
        },
        optionBubble: {
          width: 18,
          height: 18,
          position: 'relative',
          backgroundColor: '#ffffff',
        },
        instructions: {
          fontSize: 8,
          fontStyle: 'italic',
          textAlign: 'center',
          paddingHorizontal: 20,
          position: 'absolute',
          bottom: markerDimensions.margin + 5,
          left: markerDimensions.margin * 2,
          right: markerDimensions.margin * 2,
          color: '#000000',
        },
      });

      // Helper: get question options
      const getQuestionOptions = (pregunta: Exam['preguntas'][0]): string[] => {
        if (pregunta.opciones_respuesta.length === 2 && 
            pregunta.opciones_respuesta.some(o => o.texto.toLowerCase().includes('falso')) &&
            pregunta.opciones_respuesta.some(o => o.texto.toLowerCase().includes('verdadero'))) {
          const firstOptionText = pregunta.opciones_respuesta[0].texto.toLowerCase().trim();
          if (firstOptionText === 'v' || firstOptionText.includes('verdadero')) {
            return ['V', 'F'];
          }
          return ['F', 'V'];
        }
        return pregunta.opciones_respuesta.map((_, index) => String.fromCharCode(65 + index));
      };

      // Build document
      const CornerMarker = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
        const { size, margin } = calculateMarkerDimensions(paperSize);
        const containerStyle = generateMarkerContainerStyle(position, margin);
        const path = generateLMarkerPath(size);
        return (
          <View style={containerStyle}>
            <Svg width={size} height={size}>
              <Path d={path} fill="#000000" />
            </Svg>
          </View>
        );
      };

      const OptionBubble = ({ letter }: { letter: string }) => (
        <View style={styles.optionBubble}>
          <Svg width={18} height={18}>
            <Circle cx={9} cy={9} r={7} stroke="#000000" strokeWidth={1.5} fill="none" />
            <Circle cx={9} cy={9} r={6} stroke="#cccccc" strokeWidth={0.5} fill="none" />
          </Svg>
          <Text style={{ position: 'absolute', top: 4, left: letter.length > 1 ? 4 : 6, fontSize: 8, fontWeight: 'bold' }}>
            {letter}
          </Text>
        </View>
      );

      const QuestionRow = ({ pregunta, number }: { pregunta: Exam['preguntas'][0]; number: number }) => {
        const options = getQuestionOptions(pregunta);
        return (
          <View style={styles.questionRow}>
            <View style={styles.questionNumberContainer}>
              <Text style={styles.questionNumber}>{number}</Text>
            </View>
            <View style={styles.optionsRow}>
              {options.map((letter, index) => (
                <OptionBubble key={index} letter={letter} />
              ))}
            </View>
          </View>
        );
      };

      const QuestionsColumn = ({ preguntas, startIndex }: { preguntas: Exam['preguntas']; startIndex: number }) => (
        <View style={styles.column}>
          {preguntas.map((pregunta, index) => (
            <QuestionRow key={pregunta.id} pregunta={pregunta} number={startIndex + index + 1} />
          ))}
        </View>
      );

      const AnswerSheet = ({ student, qrDataUrl }: { student: Student; qrDataUrl: string }) => {
        const paginasPreguntas: Exam['preguntas'][] = [];
        for (let i = 0; i < exam.preguntas.length; i += 40) {
          paginasPreguntas.push(exam.preguntas.slice(i, i + 40));
        }

        return (
          <>
            {paginasPreguntas.map((preguntasPagina, pageIndex) => {
              const preguntasCol1 = preguntasPagina.slice(0, 20);
              const preguntasCol2 = preguntasPagina.slice(20, 40);

              return (
                <Page key={pageIndex} size="LETTER" style={styles.page}>
                  <CornerMarker position="top-left" />
                  <CornerMarker position="top-right" />
                  <CornerMarker position="bottom-left" />
                  <CornerMarker position="bottom-right" />

                  <View style={styles.container}>
                    <View style={styles.headerSection}>
                      <Text style={styles.mainTitle}>{labels.title}</Text>
                      
                      <View style={styles.infoContainer}>
                        <View style={styles.qrCode}>
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <Image src={qrDataUrl} style={{ width: 100, height: 100 }} />
                        </View>
                        
                        <View style={styles.studentInfo}>
                          <Text style={styles.infoTitle}>{labels.studentInfo}</Text>
                          <Text style={styles.infoText}>{labels.name} {student.nombres ? `${student.nombres} ${student.apellidos}` : student.apellidos}</Text>
                          <Text style={styles.infoText}>{labels.identification} {student.identificacion}</Text>
                          <Text style={styles.infoText}>{labels.group} {group.nombre}</Text>
                          <Text style={styles.infoText}>{labels.subject} {group.materia.nombre}</Text>
                          <Text style={styles.infoText}>{labels.exam} {exam.titulo}</Text>
                          <Text style={styles.infoText}>{labels.duration} {exam.duracion_minutos} {labels.minutes}</Text>
                          {paginasPreguntas.length > 1 && (
                            <Text style={styles.infoText}>
                              {labels.pageOf.replace('__current__', String(pageIndex + 1)).replace('__total__', String(paginasPreguntas.length))}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.answersSection}>
                      <View style={styles.columnsContainer}>
                        <QuestionsColumn preguntas={preguntasCol1} startIndex={pageIndex * 40} />
                        {preguntasCol2.length > 0 && (
                          <QuestionsColumn preguntas={preguntasCol2} startIndex={pageIndex * 40 + 20} />
                        )}
                      </View>
                    </View>
                  </View>

                  <Text style={styles.instructions}>{labels.instructions}</Text>
                </Page>
              );
            })}
          </>
        );
      };

      const PDFDocument = (
        <Document>
          {sortedStudents.map((student) => (
            <AnswerSheet 
              key={student.id} 
              student={student} 
              qrDataUrl={qrMap.get(student.id) || ''} 
            />
          ))}
        </Document>
      );

      // Generate blob
      const blob = await pdf(PDFDocument).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Cache it
      pdfCache.set(cacheKey, url);
      setPdfUrl(url);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  }, [exam, group, sortedStudents, labels, paperSize, cacheKey]);

  // Download the PDF
  const handleDownload = useCallback(() => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onGenerated?.();
    }
  }, [pdfUrl, fileName, onGenerated]);

  // Validate exam has questions
  if (!exam?.preguntas?.length) {
    return (
      <Button disabled variant="default">
        {t('noQuestions')}
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <Button disabled variant="destructive">
        {t('generationError')}
      </Button>
    );
  }

  // If PDF is ready, show download button
  if (pdfUrl) {
    return (
      <Button onClick={handleDownload} variant="default">
        <QrCode className="mr-2 h-4 w-4" />
        {labels.downloadPdf}
      </Button>
    );
  }

  // Show generate button (not loading state until clicked)
  return (
    <Button 
      onClick={generatePDF} 
      disabled={isGenerating}
      variant="default"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('generatingPDF')}
        </>
      ) : (
        <>
          <QrCode className="mr-2 h-4 w-4" />
          {labels.downloadPdf}
        </>
      )}
    </Button>
  );
}
