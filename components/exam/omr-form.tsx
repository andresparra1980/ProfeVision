import React from 'react';
import { MultipleChoiceOptions } from './multiple-choice-options';
import { DEFAULT_NUM_OPTIONS } from './types';

// Constants for the component
const DEFAULT_NUM_QUESTIONS = 40;
const DEFAULT_QUESTIONS_PER_COLUMN = 20;

export interface OMRFormProps {
  /**
   * Title of the form
   */
  title?: string;
  /**
   * Number of questions in the form
   * @default 40
   */
  numQuestions?: number;
  /**
   * Number of options per question (A, B, C, D, etc.)
   * @default 4
   */
  numOptions?: number;
  /**
   * Number of questions to show per column
   * @default 20
   */
  questionsPerColumn?: number;
  /**
   * Array of question numbers to disable
   */
  disabledQuestions?: number[];
  /**
   * Object mapping question numbers to selected options
   */
  selectedAnswers?: Record<number, string>;
  /**
   * Whether the form is in edit mode (allows selecting options)
   * @default false
   */
  editable?: boolean;
  /**
   * Callback when an option is selected
   */
  onAnswerChange?: (_questionNumber: number, _option: string) => void;
  /**
   * Size of the bubbles
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show column headers
   * @default true
   */
  showHeaders?: boolean;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Starting question number (for pagination)
   * @default 1
   */
  startingQuestionNumber?: number;
  /**
   * Whether to show question numbers
   * @default true
   */
  showQuestionNumbers?: boolean;
  /**
   * Object mapping question numbers to their correctness status (true=correct, false=incorrect, undefined=not set)
   */
  correctnessMap?: Record<number, boolean | undefined>;
}

export function OMRForm({
  title = 'Hoja de Respuestas',
  numQuestions = DEFAULT_NUM_QUESTIONS,
  numOptions = DEFAULT_NUM_OPTIONS,
  questionsPerColumn = DEFAULT_QUESTIONS_PER_COLUMN,
  disabledQuestions = [],
  selectedAnswers = {},
  editable = false,
  onAnswerChange,
  size = 'md',
  showHeaders = true,
  className = '',
  startingQuestionNumber = 1,
  showQuestionNumbers = true,
  correctnessMap = {},
}: OMRFormProps) {
  // Calculate the number of columns needed
  const numColumns = Math.ceil(numQuestions / questionsPerColumn);
  
  // Create an array of column data
  const columns = Array.from({ length: numColumns }, (_, colIndex) => {
    const startQuestion = colIndex * questionsPerColumn + startingQuestionNumber;
    const endQuestion = Math.min(startQuestion + questionsPerColumn - 1, numQuestions + startingQuestionNumber - 1);
    
    return {
      startQuestion,
      endQuestion,
      questions: Array.from(
        { length: endQuestion - startQuestion + 1 },
        (_, i) => startQuestion + i
      ),
    };
  });

  // Handler for option selection
  const handleOptionSelect = (questionNumber: number, option: string) => {
    if (editable && onAnswerChange) {
      onAnswerChange(questionNumber, option);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      {title && <h3 className="text-center font-medium text-lg mb-4">{title}</h3>}
      
      <div className={`grid grid-cols-${numColumns} gap-6`} style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
        {columns.map((column, colIndex) => (
          <div key={`column-${colIndex}`} className="space-y-2">
            {showHeaders && (
              <div className="flex justify-center mb-2 text-sm font-medium">
                Preguntas {column.startQuestion} - {column.endQuestion}
              </div>
            )}
            
            <div className="space-y-2">
              {column.questions.map(questionNumber => (
                <MultipleChoiceOptions
                  key={`question-${questionNumber}`}
                  questionNumber={showQuestionNumbers ? questionNumber : undefined}
                  selectedOption={selectedAnswers[questionNumber] || '-'}
                  numOptions={numOptions}
                  disabled={disabledQuestions.includes(questionNumber)}
                  readOnly={!editable}
                  onSelect={(option) => handleOptionSelect(questionNumber, option)}
                  size={size}
                  isCorrect={correctnessMap?.[questionNumber]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 