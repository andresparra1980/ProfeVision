"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Check, X } from 'lucide-react';

interface EditableExamTitleProps {
  examId: string;
  initialTitle: string;
  onSave: (_examId: string, _newTitle: string) => Promise<void>; // Function to call on save
}

const EditableExamTitle: React.FC<EditableExamTitleProps> = ({ examId, initialTitle, onSave }) => {
  const t = useTranslations('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);

  useEffect(() => {
    setCurrentTitle(initialTitle);
  }, [initialTitle]);

  const _performSave = async () => {
    if (currentTitle.trim() === '') {
      setCurrentTitle(initialTitle);
      setIsEditing(false);
      return;
    }
    try {
      await onSave(examId, currentTitle);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving exam title:", error);
      setCurrentTitle(initialTitle);
      setIsEditing(false);
    }
  };

  const _performCancel = () => {
    setCurrentTitle(initialTitle);
    setIsEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await _performSave();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    _performCancel();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await _performSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      _performCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
        <Input
          value={currentTitle}
          onChange={handleInputChange}
          className="h-8 flex-grow"
          autoFocus
          onKeyDown={handleInputKeyDown}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="button"
                tabIndex={0}
                className="inline-flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl p-0 text-green-600 transition-colors hover:bg-accent hover:text-green-700"
                onClick={handleSaveClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSaveClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
                  }
                }}
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">{t('common.save')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('common.save')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="button"
                tabIndex={0}
                className="inline-flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl p-0 text-red-600 transition-colors hover:bg-accent hover:text-red-700"
                onClick={handleCancelClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCancelClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
                  }
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t('common.cancel')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('common.cancel')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between space-x-2" onClick={(e) => e.stopPropagation()}>
      <span className="flex-grow break-words" title={initialTitle}>{currentTitle}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl p-0 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={handleEditClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEditClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
                }
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t('common.edit')}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('common.edit')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default EditableExamTitle;
