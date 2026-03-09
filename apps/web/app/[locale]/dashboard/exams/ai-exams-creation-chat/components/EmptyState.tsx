"use client";
import React from 'react';
import { FileText, Sparkles, Wand2 } from 'lucide-react';

interface EmptyStateProps {
  onExampleClick: (_text: string) => void;
  t: (_key: string, _options?: { fallback?: string }) => string;
}

export function EmptyState({ onExampleClick, t }: EmptyStateProps) {
  const examples = [
    'empty.examples.createExam',
    'empty.examples.modifyQuestion',
    'empty.examples.useDocuments',
    'empty.examples.moreHarder',
  ];

  const icons = [Sparkles, Wand2, FileText, Sparkles] as const;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--chat-accent-border))] bg-[rgb(var(--chat-accent-soft))] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[rgb(var(--chat-accent-ink))]">
        <Sparkles className="h-3.5 w-3.5" />
        {t('header.title')}
      </div>
      <h3 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {t('empty.title')}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
        {t('empty.subtitle')}
      </p>
      <div className="mt-6 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {examples.map((key, index) => {
          const Icon = icons[index] ?? Sparkles;

          return (
          <button
            key={key}
            type="button"
            onClick={() => onExampleClick(t(key))}
            className="group rounded-[24px] border border-black/10 bg-white/80 px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgb(var(--chat-accent-border))] hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--chat-accent-soft))] text-[rgb(var(--chat-accent-ink))] dark:bg-[rgb(var(--chat-accent-soft))]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium leading-6 text-foreground sm:text-base">
              {t(key)}
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-[rgb(var(--chat-accent-ink))]">
              {t('chat.inputPlaceholder')}
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
