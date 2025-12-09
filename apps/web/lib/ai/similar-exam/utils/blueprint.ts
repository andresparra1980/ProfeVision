import { Exam } from "../schemas/exam";

export type Taxonomy = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";

export interface ExamBlueprint {
  subject: string;
  level: string;
  language: string;
  totalQuestions: number;
  typesDistribution: Record<QuestionType, number>;
  difficultyDistribution: Record<Difficulty, number>;
  taxonomyDistribution: Record<Taxonomy, number>;
  avgPromptLength: number;
  tags: string[];
}

function isQuestionType(x: unknown): x is QuestionType {
  return (
    x === "multiple_choice" ||
    x === "true_false" ||
    x === "short_answer" ||
    x === "essay"
  );
}

function toTaxonomyArray(t: unknown): Taxonomy[] {
  const allowed: Taxonomy[] = [
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
  ];
  if (typeof t === "string") return allowed.includes(t as Taxonomy) ? [t as Taxonomy] : ["understand"];
  if (Array.isArray(t)) return t.filter((v) => allowed.includes(v)).length ? (t as Taxonomy[]) : ["understand"];
  return ["understand"];
}

export function deriveBlueprint(source: Exam): ExamBlueprint {
  const q = source.exam.questions;
  const total = q.length;

  const typesDistribution: Record<QuestionType, number> = {
    multiple_choice: 0,
    true_false: 0,
    short_answer: 0,
    essay: 0,
  };
  const difficultyDistribution: Record<Difficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  const taxonomyDistribution: Record<Taxonomy, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };
  let totalPromptLength = 0;
  const tagSet = new Set<string>();

  for (const item of q) {
    totalPromptLength += item.prompt?.length ?? 0;
    // types
    if (isQuestionType(item.type)) typesDistribution[item.type]++;
    // difficulty
    const diff = typeof item.difficulty === "string" ? (item.difficulty as Difficulty) : "medium";
    if (diff in difficultyDistribution) difficultyDistribution[diff]++;
    // taxonomy
    for (const t of toTaxonomyArray(item.taxonomy)) taxonomyDistribution[t]++;
    // tags
    if (Array.isArray(item.tags)) for (const t of item.tags) tagSet.add(String(t));
  }

  const avgPromptLength = total > 0 ? Math.round(totalPromptLength / total) : 0;

  return {
    subject: source.exam.subject,
    level: source.exam.level,
    language: source.exam.language,
    totalQuestions: total,
    typesDistribution,
    difficultyDistribution,
    taxonomyDistribution,
    avgPromptLength,
    tags: Array.from(tagSet).slice(0, 32),
  };
}
