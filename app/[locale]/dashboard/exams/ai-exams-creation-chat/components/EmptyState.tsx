"use client";
import React from 'react';

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
  t: (key: string, options?: { fallback?: string }) => string;
}

export function EmptyState({ onExampleClick, t }: EmptyStateProps) {
  const examples = [
    'empty.examples.createExam',
    'empty.examples.modifyQuestion',
    'empty.examples.useDocuments',
    'empty.examples.moreHarder',
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h3 className="text-2xl font-semibold tracking-tight mb-2">{t('empty.title')}</h3>
      <p className="text-muted-foreground mb-4">{t('empty.subtitle')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {examples.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onExampleClick(t(key))}
            className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
