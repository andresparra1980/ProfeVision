import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, Page, Text, View, StyleSheet, Svg, Path, Image, Font } from "@react-pdf/renderer";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { useState, useEffect } from 'react';

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
  const hash = generateValidationHash(studentId, examId);
  const data = JSON.stringify({
    studentId,
    examId,
    hash,
  });
  return await QRCode.toDataURL(data);
};

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  studentInfo: {
    fontSize: 12,
    marginBottom: 5,
  },
  alignmentMark: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#000000',
  },
  answerSection: {
    marginTop: 20,
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  optionBox: {
    width: 20,
    height: 20,
    border: '1px solid black',
    marginRight: 10,
  },
});

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
        {/* Marcas de alineación */}
        <View style={[styles.alignmentMark, { top: 0, left: 0 }]} />
        <View style={[styles.alignmentMark, { top: 0, right: 0 }]} />
        <View style={[styles.alignmentMark, { bottom: 0, left: 0 }]} />
        <View style={[styles.alignmentMark, { bottom: 0, right: 0 }]} />

        {/* Encabezado con QR e información */}
        <View style={styles.header}>
          <View style={styles.qrCode}>
            <Image src={qrCodeUrl} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{exam.titulo}</Text>
            <Text style={styles.studentInfo}>
              Estudiante: {student.nombre} {student.apellido}
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
              <Text>{index + 1}. </Text>
              {pregunta.opciones_respuesta.map((opcion) => (
                <View key={opcion.id} style={styles.optionBox} />
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}; 