"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

const languageOptions = [
  { value: 'auto', label: '🌐', fullLabel: 'Auto' },
  { value: 'es', label: '🇪🇸', fullLabel: 'Español' },
  { value: 'en', label: '🇬🇧', fullLabel: 'English' },
] as const;

export function LanguageSelector({ value, onValueChange }: LanguageSelectorProps) {
  const t = useTranslations("ai_exams_chat");

  const dropdownComponent = (
    <div className="hidden sm:flex sm:items-center sm:gap-2">
      <span className="text-sm font-medium">{t("header.examLanguageLabel")}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-[120px]"
          >
            <Globe className="h-4 w-4" />
            <span>{languageOptions.find(opt => opt.value === value)?.fullLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languageOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onValueChange(option.value)}
              className="cursor-pointer"
            >
              <span className="mr-2">{option.label}</span>
              {option.fullLabel}
              {option.value === value && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <TooltipProvider>
      {value === 'auto' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {dropdownComponent}
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-[280px] whitespace-pre-line text-sm"
          >
            {t('language.tooltip')}
          </TooltipContent>
        </Tooltip>
      ) : (
        dropdownComponent
      )}
    </TooltipProvider>
  );
}
