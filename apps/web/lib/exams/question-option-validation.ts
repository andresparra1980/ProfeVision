export const MIN_QUESTION_OPTIONS = 2;
export const MAX_QUESTION_OPTIONS = 4;

export type InvalidQuestionOptionCount = {
  index: number;
  optionCount: number;
};

type ExamOption = {
  texto?: string | null;
};

type ExamQuestion = {
  texto?: string | null;
  opciones?: ExamOption[] | null;
};

type ImportedQuestion = {
  pregunta?: string | null;
  opciones?: Record<string, string | undefined> | null;
};

function countNonEmptyTexts(values: Array<string | null | undefined>) {
  return values.filter((value) => (value || "").trim() !== "").length;
}

function getInvalidQuestionOptionCounts(
  preguntas: ExamQuestion[] | ImportedQuestion[] | null | undefined,
  getQuestionText: (_pregunta: ExamQuestion | ImportedQuestion) => string,
  getOptionValues: (_pregunta: ExamQuestion | ImportedQuestion) => Array<string | null | undefined>
): InvalidQuestionOptionCount[] {
  if (!Array.isArray(preguntas)) return [];

  const invalidQuestions: InvalidQuestionOptionCount[] = [];

  for (let index = 0; index < preguntas.length; index++) {
    const pregunta = preguntas[index];
    const questionText = getQuestionText(pregunta).trim();

    if (!questionText) continue;

    const optionCount = countNonEmptyTexts(getOptionValues(pregunta));

    if (
      optionCount < MIN_QUESTION_OPTIONS ||
      optionCount > MAX_QUESTION_OPTIONS
    ) {
      invalidQuestions.push({ index, optionCount });
    }
  }

  return invalidQuestions;
}

export function getQuestionOptionCountIssues(
  preguntas: ExamQuestion[] | null | undefined
) {
  return getInvalidQuestionOptionCounts(
    preguntas,
    (pregunta) => (pregunta as ExamQuestion)?.texto || "",
    (pregunta) =>
      Array.isArray((pregunta as ExamQuestion)?.opciones)
        ? (pregunta as ExamQuestion).opciones!.map((opcion) => opcion?.texto)
        : []
  );
}

export function getQuestionOptionCountError(
  preguntas: ExamQuestion[] | null | undefined
) {
  const [firstInvalidQuestion] = getQuestionOptionCountIssues(preguntas);
  return firstInvalidQuestion || null;
}

export function getImportedQuestionOptionCountIssues(
  preguntas: ImportedQuestion[] | null | undefined
) {
  return getInvalidQuestionOptionCounts(
    preguntas,
    (pregunta) => (pregunta as ImportedQuestion)?.pregunta || "",
    (pregunta) => Object.values((pregunta as ImportedQuestion)?.opciones || {})
  );
}

export function getImportedQuestionOptionCountError(
  preguntas: ImportedQuestion[] | null | undefined
) {
  const [firstInvalidQuestion] = getImportedQuestionOptionCountIssues(preguntas);
  return firstInvalidQuestion || null;
}

export function hasValidGeneratedOptionCount(opciones: ExamOption[] | null | undefined) {
  const optionCount = countNonEmptyTexts(
    Array.isArray(opciones) ? opciones.map((opcion) => opcion?.texto) : []
  );

  return (
    optionCount >= MIN_QUESTION_OPTIONS && optionCount <= MAX_QUESTION_OPTIONS
  );
}
