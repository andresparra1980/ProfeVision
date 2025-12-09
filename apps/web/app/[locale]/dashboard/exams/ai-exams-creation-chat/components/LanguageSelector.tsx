"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LanguageSelectorProps {
  value: 'auto' | 'es' | 'en';
  onValueChange: (_value: 'auto' | 'es' | 'en') => void;
}

export function LanguageSelector({ value, onValueChange }: LanguageSelectorProps) {
  const t = useTranslations("ai_exams_chat");

  const selectComponent = (
    <div className="hidden sm:flex sm:items-center sm:gap-2">
      <span className="text-sm font-medium">{t("header.examLanguageLabel")}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('language.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">
            <span className="flex items-center gap-2">
              🌐 {t('language.auto')}
            </span>
          </SelectItem>
          <SelectItem value="es">
            <span className="flex items-center gap-2">
              🇪🇸 Español
            </span>
          </SelectItem>
          <SelectItem value="en">
            <span className="flex items-center gap-2">
              🇬🇧 English
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <TooltipProvider>
      {value === 'auto' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {selectComponent}
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="start"
            className="max-w-[280px] whitespace-pre-line text-sm"
          >
            {t('language.tooltip')}
          </TooltipContent>
        </Tooltip>
      ) : (
        selectComponent
      )}
    </TooltipProvider>
  );
}
