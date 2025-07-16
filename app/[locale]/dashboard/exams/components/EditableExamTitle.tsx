"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

interface EditableExamTitleProps {
  examId: string;
  initialTitle: string;
  onSave: (_examId: string, _newTitle: string) => Promise<void>; // Function to call on save
}

const EditableExamTitle: React.FC<EditableExamTitleProps> = ({ examId, initialTitle, onSave }) => {
  const t = useTranslations('dashboard.exams');
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
          className="h-8 w-36"
          autoFocus
          onKeyDown={handleInputKeyDown}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 flex-shrink-0"
          onClick={handleSaveClick}
          title={t('common.save')}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 flex-shrink-0"
          onClick={handleCancelClick}
          title={t('common.cancel')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between space-x-1" onClick={(e) => e.stopPropagation()}>
      <span className="flex-grow truncate" title={initialTitle}>{currentTitle}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={handleEditClick}
        title={t('actions.edit')}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EditableExamTitle;
