"use client";

import { useState, useEffect } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Circle, Svg, Path, Rect, Image } from '@react-pdf/renderer';
import { generateLMarkerPath, calculateMarkerDimensions, generateMarkerContainerStyle } from '@/lib/utils/corner-markers';
import { generateOptimizedQRCode, generateOptimizedQRData } from '@/lib/utils/qr-code';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
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

interface PDFGeneratorProps {
  exam: Exam;
  group: Group;
  paperSize: 'LETTER' | 'A4';
  fileName: string;
}

// Definir estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    height: '100%',
    border: '3pt solid black', // Aumentado a 3pt (triple de grosor original)
  },
  container: {
    margin: calculateMarkerDimensions().margin * 2, // Doble del margen de los marcadores
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
    border: '3pt solid black', // Aumentado a 3pt (triple de grosor original)
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
    padding: 15,
    position: 'relative',
    flexGrow: 1,
    height: 'calc(100% - 140px)',
    border: '3pt solid black', // Aumentado a 3pt (triple de grosor original)
    margin: '8 8 15 8',
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    flexGrow: 1,
  },
  column: {
    width: '48%',
    borderRight: '1.5pt solid #cccccc', // Aumentado a 1.5pt (triple de grosor original)
    paddingRight: 8,
    '&:last-child': {
      borderRight: 'none',
      paddingRight: 0,
    },
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 22,
    borderBottom: '1.5pt solid #cccccc', // Aumentado a 1.5pt (triple de grosor original)
    paddingBottom: 5,
  },
  questionNumberContainer: {
    width: 24,
    height: 24,
    border: '2pt solid black', // Aumentado a 2pt (doble de grosor original)
    marginRight: 10,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
    paddingLeft: 4,
  },
  optionBubble: {
    width: 24,
    height: 24,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  instructions: {
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: calculateMarkerDimensions().margin + 5,
    left: calculateMarkerDimensions().margin * 2,
    right: calculateMarkerDimensions().margin * 2,
    color: '#000000',
  },
});

// Componente para los marcadores en forma de L
const CornerMarker = ({ position, paperSize = 'LETTER' }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; paperSize?: 'LETTER' | 'A4' }) => {
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

// Componente para una burbuja de opción mejorada
const OptionBubble = ({ letter }: { letter: string }) => (
  <View style={styles.optionBubble}>
    <Svg width={24} height={24}>
      {/* Círculo exterior más grueso para mejor detección */}
      <Circle 
        cx={12} 
        cy={12} 
        r={9} 
        stroke="#000000" 
        strokeWidth={2} // Aumentado a 2 (doble de grosor original)
        fill="none" 
      />
      {/* Círculo interior para guía visual */}
      <Circle 
        cx={12} 
        cy={12} 
        r={8} 
        stroke="#cccccc" 
        strokeWidth={0.5} 
        fill="none" 
      />
      {/* Letra centrada */}
      <Text 
        x={letter.length > 1 ? 6 : 9} 
        y={15} 
        style={{ 
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        {letter}
      </Text>
    </Svg>
  </View>
);

// Función para determinar las opciones de respuesta
const getQuestionOptions = (pregunta: Exam['preguntas'][0]): string[] => {
  // Si es una pregunta de Falso/Verdadero
  if (pregunta.opciones_respuesta.length === 2 && 
      pregunta.opciones_respuesta.some(o => o.texto.toLowerCase().includes('falso')) &&
      pregunta.opciones_respuesta.some(o => o.texto.toLowerCase().includes('verdadero'))) {
    return ['F', 'V'];
  }
  
  // Para otras preguntas, usar letras según la cantidad de opciones
  return pregunta.opciones_respuesta.map((_, index) => 
    String.fromCharCode(65 + index)
  );
};

// Componente para una fila de pregunta con sus opciones
const QuestionRow = ({ pregunta, number }: { pregunta: Exam['preguntas'][0]; number: number }) => {
  const options = getQuestionOptions(pregunta);
  
  return (
    <View style={styles.questionRow}>
      <View style={styles.questionNumberContainer}>
        <Text style={styles.questionNumber}>{number}</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((letter, index) => (
          <OptionBubble 
            key={index} 
            letter={letter}
          />
        ))}
      </View>
    </View>
  );
};

// Componente para una columna de preguntas
const QuestionsColumn = ({ preguntas, startIndex }: { preguntas: Exam['preguntas']; startIndex: number }) => (
  <View style={styles.column}>
    {preguntas.map((pregunta, index) => (
      <QuestionRow 
        key={pregunta.id} 
        pregunta={pregunta}
        number={startIndex + index + 1}
      />
    ))}
  </View>
);

// Componente para el código QR
const QRCodeComponent = ({ data }: { data: string }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateOptimizedQRCode(data).then(url => {
      setQrDataUrl(url);
    });
  }, [data]);

  if (!qrDataUrl) return null;

  return (
    <View style={styles.qrCode}>
      <Image src={qrDataUrl} style={{ width: 100, height: 100 }} />
    </View>
  );
};

// Componente para una hoja de respuestas individual
const AnswerSheet = ({ exam, student, group }: { exam: Exam; student: Student; group: Group }) => {
  const qrData = generateOptimizedQRData({
    examId: exam.id,
    studentId: student.id,
    groupId: group.id
  });

  // Dividir las preguntas en grupos de 20 máximo (antes 24)
  const paginasPreguntas = [];
  for (let i = 0; i < exam.preguntas.length; i += 20) {
    paginasPreguntas.push(exam.preguntas.slice(i, i + 20));
  }

  return (
    <>
      {paginasPreguntas.map((preguntasPagina, pageIndex) => {
        // Dividir en columnas de 10 preguntas cada una (antes 12)
        const preguntasCol1 = preguntasPagina.slice(0, 10);
        const preguntasCol2 = preguntasPagina.slice(10, 20);

        return (
          <Page key={pageIndex} size="LETTER" style={styles.page}>
            {/* Marcadores en forma de L externos */}
            <CornerMarker position="top-left" />
            <CornerMarker position="top-right" />
            <CornerMarker position="bottom-left" />
            <CornerMarker position="bottom-right" />

            <View style={styles.container}>
              <View style={styles.headerSection}>
                <Text style={styles.mainTitle}>HOJA DE RESPUESTAS</Text>
                
                <View style={styles.infoContainer}>
                  <View style={styles.qrCode}>
                    <QRCodeComponent data={qrData} />
                  </View>
                  
                  <View style={styles.studentInfo}>
                    <Text style={styles.infoTitle}>Información del Estudiante</Text>
                    <Text style={styles.infoText}>Nombre: {student.nombre} {student.apellido}</Text>
                    <Text style={styles.infoText}>Identificación: {student.identificacion}</Text>
                    <Text style={styles.infoText}>Grupo: {group.nombre}</Text>
                    <Text style={styles.infoText}>Materia: {group.materia.nombre}</Text>
                    <Text style={styles.infoText}>Examen: {exam.titulo}</Text>
                    <Text style={styles.infoText}>Duración: {exam.duracion_minutos} minutos</Text>
                    {paginasPreguntas.length > 1 && (
                      <Text style={styles.infoText}>Página {pageIndex + 1} de {paginasPreguntas.length}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.answersSection}>
                <View style={styles.columnsContainer}>
                  <QuestionsColumn 
                    preguntas={preguntasCol1} 
                    startIndex={pageIndex * 20}
                  />
                  {preguntasCol2.length > 0 && (
                    <QuestionsColumn 
                      preguntas={preguntasCol2}
                      startIndex={pageIndex * 20 + 10}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Instrucciones fuera del contenedor */}
            <Text style={styles.instructions}>
              Instrucciones: Rellene completamente el círculo que corresponda a la respuesta correcta.
              Use lápiz negro o azul. No use bolígrafo rojo. Asegúrese de borrar completamente si necesita cambiar una respuesta.
            </Text>
          </Page>
        );
      })}
    </>
  );
};

// Componente principal que genera el PDF
const PDFDocument = ({ exam, group }: { exam: Exam; group: Group }) => (
  <Document>
    {group.estudiantes.map((student) => (
      <AnswerSheet
        key={student.id}
        exam={exam}
        student={student}
        group={group}
      />
    ))}
  </Document>
);

export function PDFGenerator({ exam, group, paperSize, fileName }: PDFGeneratorProps) {
  return (
    <PDFDownloadLink
      document={<PDFDocument exam={exam} group={group} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
    </PDFDownloadLink>
  );
} 