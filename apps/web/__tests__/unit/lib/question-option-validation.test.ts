import { describe, expect, it } from "vitest";
import {
  getImportedQuestionOptionCountIssues,
  getImportedQuestionOptionCountError,
  getQuestionOptionCountError,
  hasValidGeneratedOptionCount,
} from "@/lib/exams/question-option-validation";

describe("question option validation", () => {
  it("accepts questions with 2 to 4 non-empty options", () => {
    expect(
      getQuestionOptionCountError([
        {
          texto: "Pregunta valida",
          opciones: [{ texto: "A" }, { texto: "B" }, { texto: "" }, { texto: " " }],
        },
      ])
    ).toBeNull();
  });

  it("accepts questions with exactly 4 non-empty options", () => {
    expect(
      getQuestionOptionCountError([
        {
          texto: "Pregunta valida 4 opciones",
          opciones: [{ texto: "A" }, { texto: "B" }, { texto: "C" }, { texto: "D" }],
        },
      ])
    ).toBeNull();
  });

  it("rejects imported questions with more than 4 options", () => {
    expect(
      getImportedQuestionOptionCountError([
        {
          pregunta: "Pregunta invalida",
          opciones: { a: "A", b: "B", c: "C", d: "D", e: "E" },
        },
      ])
    ).toEqual({ index: 0, optionCount: 5 });
  });

  it("returns all invalid imported questions", () => {
    expect(
      getImportedQuestionOptionCountIssues([
        {
          pregunta: "Pregunta 1",
          opciones: { a: "A" },
        },
        {
          pregunta: "Pregunta 2",
          opciones: { a: "A", b: "B", c: "C", d: "D", e: "E" },
        },
      ])
    ).toEqual([
      { index: 0, optionCount: 1 },
      { index: 1, optionCount: 5 },
    ]);
  });

  it("rejects generated questions with fewer than 2 options", () => {
    expect(hasValidGeneratedOptionCount([{ texto: "A" }])).toBe(false);
  });
});
