import { Check, X } from 'lucide-react';
import { DEFAULT_NUM_OPTIONS, OPTION_LETTERS } from './types';

export interface MultipleChoiceOptionsProps {
  selectedOption?: string;
  numOptions?: number;
  disabled?: boolean;
  readOnly?: boolean;
  onSelect?: (_option: string) => void;
  questionNumber?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  isCorrect?: boolean;
}

export function MultipleChoiceOptions({
  selectedOption = '-',
  numOptions = DEFAULT_NUM_OPTIONS,
  disabled = false,
  readOnly = true,
  onSelect,
  questionNumber,
  size = 'md',
  showLabels = false,
  className = '',
  isCorrect,
}: MultipleChoiceOptionsProps) {
  const selectedIndex = OPTION_LETTERS.indexOf(selectedOption.toUpperCase());
  
  // Función para obtener el color de la burbuja según la opción
  const getAnswerBubbleStyle = (value: string) => {
    if (value === '-') return 'bg-gray-200';
    
    switch (value.toUpperCase()) {
      case 'A': return 'bg-blue-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-purple-500';
      case 'E': return 'bg-pink-500';
      case 'F': return 'bg-indigo-500';
      case 'G': return 'bg-red-500';
      case 'H': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  // Determinar tamaño de las burbujas
  const sizeClasses = {
    sm: 'w-3.5 h-3.5 text-[9px]',
    md: 'w-4 h-4 text-[10px]',
    lg: 'w-5 h-5 text-xs'
  };
  
  const bubbleSize = sizeClasses[size];
  
  // Renderizar opciones
  const renderOptions = () => {
    return Array.from({ length: numOptions }).map((_, i) => {
      const isSelected = i === selectedIndex;
      const optionLetter = OPTION_LETTERS[i];
      
      const handleClick = () => {
        if (!disabled && !readOnly && onSelect) {
          onSelect(optionLetter);
        }
      };
      
      return (
        <div 
          key={`bubble-${questionNumber || 0}-${i}`}
          className={`${bubbleSize} rounded-full flex items-center justify-center font-medium transition-colors
            ${disabled 
              ? 'bg-gray-200 text-gray-400 opacity-30' 
              : isSelected 
                ? `${getAnswerBubbleStyle(optionLetter)} text-white`
                : 'bg-gray-200 text-gray-800 dark:text-gray-400 dark:bg-gray-800'
            } ${!readOnly ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={handleClick}
          role={!readOnly ? "button" : undefined}
          aria-label={!readOnly ? `Seleccionar opción ${optionLetter}` : undefined}
        >
          {optionLetter}
        </div>
      );
    });
  };

  const iconSize = 14;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {questionNumber !== undefined && (
        <span className={`font-mono font-medium text-sm min-w-[26px] ${disabled ? 'line-through opacity-40' : ''}`}>
          {String(questionNumber).padStart(2, '0')}.
        </span>
      )}
      <div className="flex items-center space-x-1">
        {renderOptions()}
      </div>
      {!disabled && isCorrect === true && <Check className="text-green-600 dark:text-green-400 ml-0.5 flex-shrink-0" size={iconSize} />}
      {!disabled && isCorrect === false && <X className="text-red-600 dark:text-red-400 ml-0.5 flex-shrink-0" size={iconSize} />}
      {showLabels && (
        <div className="flex ml-2 text-xs text-gray-500 dark:text-gray-400 space-x-2">
          {Array.from({ length: numOptions }).map((_, i) => (
            <span key={`label-${i}`}>{OPTION_LETTERS[i]}</span>
          ))}
        </div>
      )}
    </div>
  );
} 