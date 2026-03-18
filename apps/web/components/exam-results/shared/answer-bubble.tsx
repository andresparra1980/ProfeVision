import { cn } from '@/lib/utils';
import { getAnswerBubbleStyle } from '../utils/answer-helpers';

interface AnswerBubbleProps {
  letter: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnswerBubble({
  letter,
  isSelected,
  isDisabled = false,
  onClick,
  className
}: AnswerBubbleProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold',
        isSelected ? getAnswerBubbleStyle(letter) : 'bg-gray-200',
        !isDisabled && 'cursor-pointer hover:opacity-80 transition-opacity',
        isDisabled && 'cursor-not-allowed',
        className
      )}
      aria-label={letter ? `Option ${letter}` : 'Unselected option'}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
    >
      {isSelected ? letter : ''}
    </button>
  );
}
