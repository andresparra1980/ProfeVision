import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { htmlToPlainText } from "@/lib/utils/htmlToPlainText";

// Tamaños de papel en puntos (1 punto = 1/72 pulgada)
// Used for type inference, keeping with underscore prefix
const _PAGE_SIZES = {
  letter: [612, 792], // 8.5" x 11"
  a4: [595, 842], // 210mm x 297mm
  legal: [612, 1008], // 8.5" x 14"
} as const;

type PaperSize = keyof typeof _PAGE_SIZES;

// Función para convertir el tamaño de papel a formato aceptado por react-pdf
function getPageSize(paperSize: PaperSize) {
  switch (paperSize) {
    case "letter":
      return "LETTER";
    case "a4":
      return "A4";
    case "legal":
      return "LEGAL";
  }
}

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  institutionName: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    marginBottom: 4,
  },
  metadata: {
    fontSize: 10,
    color: "#666666",
  },
  title: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
  },
  instructions: {
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: "Times-Bold",
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 10,
  },
  examInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    fontSize: 10,
    color: "#666666",
  },
  questions: {
    marginTop: 20,
  },
  questionContainer: {
    marginBottom: 16,
  },
  question: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 8,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  questionText: {
    flex: 1,
    fontFamily: "Times-Bold",
  },
  points: {
    fontSize: 10,
    color: "#666666",
  },
  options: {
    marginLeft: 16,
  },
  option: {
    flexDirection: "row",
    marginBottom: 4,
  },
  optionLetter: {
    width: 16,
    fontFamily: "Times-Bold",
  },
  groupName: {
    fontSize: 10,
    color: "#666666",
  },
});

interface ExamPDFProps {
  exam: {
    titulo: string;
    descripcion?: string | null;
    instrucciones?: string | null;
    duracion_minutos: number;
    puntaje_total: number;
    created_at: string;
    materias: {
      nombre: string;
      profesor: {
        nombres: string;
        apellidos: string;
        cargo: string;
      };
      entidad: {
        nombre: string;
      };
    };
    preguntas: Array<{
      id: string;
      texto: string;
      puntaje: number;
      opciones_respuesta: Array<{
        id: string;
        texto: string;
      }>;
    }>;
  };
  paperSize?: PaperSize;
  selectedGroup?: {
    id: string;
    nombre: string;
  };
}

export function ExamPDF({ exam, paperSize = "letter", selectedGroup }: ExamPDFProps) {
  // Obtener el tamaño de página en el formato correcto
  const size = getPageSize(paperSize);

  // Formatear la fecha en el cliente
  const formattedDate = format(new Date(exam.created_at), "d 'de' MMMM 'de' yyyy", { 
    locale: es 
  });

  // Formatear el nombre completo del profesor (no usado actualmente)
  // const _profesorNombreCompleto = `${exam.materias.profesor.nombres} ${exam.materias.profesor.apellidos}`;

  return (
    <Document>
      <Page size={size} style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>
            {exam.materias.entidad.nombre}
          </Text>
          <Text style={styles.subjectName}>{exam.materias.nombre}</Text>
          {selectedGroup && (
            <Text style={styles.groupName}>Grupo: {selectedGroup.nombre}</Text>
          )}
          <Text style={styles.metadata}>
            Fecha: {formattedDate}
          </Text>
        </View>

        {/* Título y descripción */}
        <Text style={styles.title}>{exam.titulo}</Text>
        {exam.descripcion && (
          <Text style={styles.description}>{exam.descripcion}</Text>
        )}

        {/* Instrucciones */}
        {exam.instrucciones && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Instrucciones:</Text>
            <Text style={styles.instructionsText}>{exam.instrucciones}</Text>
          </View>
        )}

        {/* Información del examen */}
        <View style={styles.examInfo}>
          <Text>Duración: {exam.duracion_minutos} minutos</Text>
          <Text>Puntaje total: {exam.puntaje_total} puntos</Text>
        </View>

        {/* Preguntas */}
        <View style={styles.questions}>
          {exam.preguntas.map((pregunta, index) => (
            <View key={pregunta.id} style={styles.questionContainer}>
              <View wrap={false} style={styles.question}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionText}>
                    {index + 1}. {htmlToPlainText(pregunta.texto)}
                  </Text>
                  <Text style={styles.points}>{pregunta.puntaje} pts</Text>
                </View>
                {pregunta.opciones_respuesta.length > 0 && (
                  <View style={styles.options}>
                    {pregunta.opciones_respuesta.map((opcion, optIndex) => (
                      <View key={opcion.id} style={styles.option}>
                        <Text style={styles.optionLetter}>
                          {String.fromCharCode(65 + optIndex)})
                        </Text>
                        <Text>{htmlToPlainText(opcion.texto)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
} 