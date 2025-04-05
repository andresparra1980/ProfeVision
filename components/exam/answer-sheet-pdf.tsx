import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Image, Font, Circle } from "@react-pdf/renderer";
import CryptoJS from "crypto-js";
import { useState, useEffect } from 'react';
import { generateLMarkerPath, calculateMarkerDimensions, generateMarkerContainerStyle } from '@/lib/utils/corner-markers';
import { generateOptimizedQRCode, generateOptimizedQRData } from '@/lib/utils/qr-code';

// Definir tamaños de papel en puntos (1 punto = 1/72 pulgadas)
const PAPER_SIZES = {
  LETTER: { width: 612, height: 792 },
  A4: { width: 595, height: 842 },
} as const;

type PaperSize = keyof typeof PAPER_SIZES;

// Convertir puntos a milímetros
const ptToMm = (pt: number) => pt * 0.352778;

// Generar hash de validación
const generateValidationHash = (studentId: string, examId: string) => {
  const secret = process.env.EXAM_RESPONSE_SHEET_SECRET_KEY || 'default-secret';
  const salt = process.env.EXAM_RESPONSE_SHEET_SALT || 'default-salt';
  const data = `${studentId}:${examId}:${salt}`;
  return CryptoJS.HmacSHA256(data, secret).toString();
};

// Generar QR code de forma asíncrona
const generateQRCode = async (studentId: string, examId: string): Promise<string> => {
  const data = generateOptimizedQRData({ studentId, examId });
  return await generateOptimizedQRCode(data);
};

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
    height: '100%',
    border: '3pt solid black',
  },
  container: {
    margin: calculateMarkerDimensions().margin * 2,
    minHeight: 720,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    height: 130,
    padding: '5 10',
  },
  qrCode: {
    width: 112,
    height: 112,
    marginTop: -10,
    marginLeft: -5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  studentInfo: {
    fontSize: 8,
    marginBottom: 4,
    lineHeight: 1.2,
  },
  alignmentMarkExternal: {
    position: 'absolute',
    width: 36,
    height: 36,
    backgroundColor: 'transparent',
  },
  alignmentMarkInternal: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
  },
  answerSection: {
    marginTop: 10,
    position: 'relative',
    padding: 20,
    flexGrow: 1,
    height: 'calc(100% - 150px)',
    border: '3pt solid black',
    margin: '10 10 20 10',
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
  questionRow: {
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 24,
    alignItems: 'center',
    borderBottom: '1.5pt solid #cccccc',
    paddingBottom: 8,
  },
  questionNumberContainer: {
    width: 24,
    height: 24,
    border: '2pt solid black',
    marginRight: 12,
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
    paddingLeft: 4,
  },
  optionBubble: {
    width: 24,
    height: 24,
    position: 'relative',
  },
});

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
}

interface ExamQuestion {
  id: string;
  texto: string;
  opciones_respuesta: Array<{
    id: string;
    texto: string;
  }>;
  puntaje: number;
}

interface AnswerSheetPDFProps {
  exam: {
    id: string;
    titulo: string;
    descripcion?: string;
    duracion_minutos: number;
    preguntas: ExamQuestion[];
  };
  student: Student;
  group: Group;
  paperSize?: PaperSize;
}

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

// Componente para una burbuja de opción
const OptionBubble = ({ letter }: { letter: string }) => (
  <View style={styles.optionBubble}>
    <Svg width={24} height={24}>
      {/* Círculo exterior más grueso para mejor detección */}
      <Circle 
        cx={12} 
        cy={12} 
        r={9} 
        stroke="#000000" 
        strokeWidth={2}
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

export const AnswerSheetPDF = ({ exam, student, group, paperSize = 'LETTER' }: AnswerSheetPDFProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const dimensions = PAPER_SIZES[paperSize];

  useEffect(() => {
    generateQRCode(student.id, exam.id).then(setQrCodeUrl);
  }, [student.id, exam.id]);

  if (!qrCodeUrl) {
    return null;
  }

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
        {/* Marcadores en forma de L externos */}
        <CornerMarker position="top-left" paperSize={paperSize} />
        <CornerMarker position="top-right" paperSize={paperSize} />
        <CornerMarker position="bottom-left" paperSize={paperSize} />
        <CornerMarker position="bottom-right" paperSize={paperSize} />

        <View style={styles.container}>
          {/* Encabezado con QR e información */}
          <View style={styles.header}>
            <View style={styles.qrCode}>
              <Image src={qrCodeUrl} style={{ width: 112, height: 112 }} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{exam.titulo}</Text>
              <Text style={styles.studentInfo}>
                Estudiante: {student.nombres} {student.apellidos}
              </Text>
              <Text style={styles.studentInfo}>
                Identificación: {student.identificacion}
              </Text>
              <Text style={styles.studentInfo}>
                Grupo: {group.nombre} - {group.materia.nombre}
              </Text>
              <Text style={styles.studentInfo}>
                Universidad Tecnológica de Pereira
              </Text>
              <Text style={styles.studentInfo}>
                Fecha: {format(new Date(), 'PPP', { locale: es })}
              </Text>
            </View>
          </View>

          {/* Sección de respuestas */}
          <View style={styles.answerSection}>
            {exam.preguntas.map((pregunta, index) => (
              <View key={pregunta.id} style={styles.questionRow}>
                <View style={styles.questionNumberContainer}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>
                <View style={styles.optionsContainer}>
                  {pregunta.opciones_respuesta.map((opcion, optIndex) => (
                    <OptionBubble 
                      key={opcion.id} 
                      letter={String.fromCharCode(65 + optIndex)} 
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Instrucciones fuera del contenedor */}
        <Text style={styles.instructions}>
          Instrucciones: Rellene completamente el círculo que corresponda a la respuesta correcta.
          Use lápiz negro o azul. No use bolígrafo rojo. Asegúrese de borrar completamente si necesita cambiar una respuesta.
        </Text>
      </Page>
    </Document>
  );
}; 