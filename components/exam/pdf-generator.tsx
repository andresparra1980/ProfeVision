"use client";

import { useState, useEffect } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Circle, Svg, Path, Rect, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

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
    padding: 30,
  },
  container: {
    border: '1pt solid black',
    height: '100%',
  },
  headerSection: {
    borderBottom: '1pt solid black',
    padding: 10,
  },
  mainTitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  studentInfo: {
    width: '65%',
    border: '1pt solid black',
    padding: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 3,
  },
  answersSection: {
    padding: 20,
    position: 'relative',
    flexGrow: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  column: {
    width: '48%',
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  questionNumber: {
    width: 25,
    fontSize: 10,
    textAlign: 'right',
    marginRight: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  optionBubble: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  instructions: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
});

// Componente para las marcas de alineación
const AlignmentMark = ({ style }: { style: any }) => (
  <Svg width={12} height={12} style={style}>
    <Path d="M0,6 H12 M6,0 V12" stroke="#000000" strokeWidth={0.5} />
    <Circle cx={6} cy={6} r={2} fill="#000000" />
  </Svg>
);

// Componente para una burbuja de opción
const OptionBubble = ({ letter }: { letter: string }) => (
  <View style={styles.optionBubble}>
    <Svg width={20} height={20}>
      <Circle cx={10} cy={10} r={8} stroke="#000000" strokeWidth={0.5} fill="none" />
      <Text x={letter.length > 1 ? 4 : 7} y={13} style={{ fontSize: 9 }}>{letter}</Text>
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
      <Text style={styles.questionNumber}>{number}.</Text>
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
    QRCode.toDataURL(data, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(url => {
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
  const qrData = JSON.stringify({
    examId: exam.id,
    studentId: student.id,
    groupId: group.id,
    timestamp: new Date().toISOString(),
  });

  // Dividir las preguntas en grupos de 30 máximo
  const paginasPreguntas = [];
  for (let i = 0; i < exam.preguntas.length; i += 30) {
    paginasPreguntas.push(exam.preguntas.slice(i, i + 30));
  }

  return (
    <>
      {paginasPreguntas.map((preguntasPagina, pageIndex) => {
        // Dividir en columnas de 15 preguntas cada una
        const preguntasCol1 = preguntasPagina.slice(0, 15);
        const preguntasCol2 = preguntasPagina.slice(15, 30);

        return (
          <Page key={pageIndex} size="LETTER" style={styles.page}>
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
                {/* Marcas de alineación en las esquinas */}
                <AlignmentMark style={{ position: 'absolute', top: 5, left: 5 }} />
                <AlignmentMark style={{ position: 'absolute', top: 5, right: 5 }} />
                <AlignmentMark style={{ position: 'absolute', bottom: 5, left: 5 }} />
                <AlignmentMark style={{ position: 'absolute', bottom: 5, right: 5 }} />

                <View style={styles.columnsContainer}>
                  <QuestionsColumn 
                    preguntas={preguntasCol1} 
                    startIndex={pageIndex * 30}
                  />
                  {preguntasCol2.length > 0 && (
                    <QuestionsColumn 
                      preguntas={preguntasCol2}
                      startIndex={pageIndex * 30 + 15}
                    />
                  )}
                </View>

                <Text style={styles.instructions}>
                  Instrucciones: Rellene completamente el círculo que corresponda a la respuesta correcta.
                  Use lápiz negro o azul. No use bolígrafo rojo. Asegúrese de borrar completamente si necesita cambiar una respuesta.
                </Text>
              </View>
            </View>
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