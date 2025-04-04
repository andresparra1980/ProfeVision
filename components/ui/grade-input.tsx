import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GradeInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function GradeInput({
  value,
  onChange,
  min = 0,
  max = 5,
  className,
  disabled = false,
  placeholder,
}: GradeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');

  // Solo actualizar el input value cuando cambia el valor externo y no estamos editando
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(value === null ? '' : value.toFixed(1));
    }
  }, [value, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validar que sea un número válido entre 0 y 5
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 5) {
      onChange(numericValue);
    } else if (newValue === '') {
      onChange(null);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);

    // Al perder el foco, formatear el valor
    if (value !== null) {
      setInputValue(value.toFixed(2));
    }
  };

  const getBackgroundColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 3.0) return 'bg-green-50';
    return 'bg-red-50';
  };

  return (
    <Input
      type="number"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        'w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        getBackgroundColor(value),
        className
      )}
      min={min}
      max={max}
      step={0.1}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
} 