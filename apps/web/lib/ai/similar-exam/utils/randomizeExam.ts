export type RNG = () => number;

// Mulberry32 PRNG for deterministic shuffles
function mulberry32(seed: number): RNG {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: RNG) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple_choice' | string;
  options?: string[];
  answer: unknown;
}

export interface ExamLike {
  exam: {
    title: string;
    subject: string;
    level: string;
    language: string;
    questions: Array<MultipleChoiceQuestion & Record<string, unknown>>;
  };
}

export function randomizeExamOrder(payload: ExamLike, seed = 42): ExamLike {
  const rng = mulberry32(seed);
  const cloned: ExamLike = JSON.parse(JSON.stringify(payload));
  const qs = cloned.exam.questions;

  // Shuffle questions
  shuffleInPlace(qs, rng);

  // Shuffle MCQ options and fix answers when answer is the index or string match
  for (const q of qs) {
    if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
      // Build index map
      const originalOptions = [...q.options];
      shuffleInPlace(q.options, rng);

      // If answer was index number
      if (typeof q.answer === 'number') {
        const prevIndex = q.answer as number;
        const correctText = originalOptions[prevIndex];
        const newIndex = q.options.findIndex((opt) => opt === correctText);
        q.answer = newIndex >= 0 ? newIndex : 0;
      }
      // If answer was text, keep as text; consumer should validate later
    }
  }

  // Re-index question ids q1..qN
  cloned.exam.questions = cloned.exam.questions.map((q, idx) => ({ ...q, id: `q${idx + 1}` }));
  return cloned;
}
