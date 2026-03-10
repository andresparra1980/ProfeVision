/**
 * Summary formatting utilities
 */

import { escapeHtml } from './formatting';

interface SummaryLabels {
  overviewTitle: string;
  academicLevelLabel: string;
  mainTopicsTitle: string;
  keyTermsLabel: string;
  conceptsLabel: string;
}

export function buildStructuredSummaryHtml(data: unknown, labels: SummaryLabels): string | null {
  try {
    const base: unknown = (data as { summary?: unknown } | null | undefined)?.summary ?? data;
    if (!base || typeof base !== 'object') return null;
    const s = base as Record<string, unknown>;
    const parts: string[] = [];

    const generalOverview = typeof s.generalOverview === 'string' ? s.generalOverview : '';
    if (generalOverview.trim()) {
      parts.push(`<h2>${escapeHtml(labels.overviewTitle)}</h2><p>${escapeHtml(generalOverview)}</p>`);
    }

    const academicLevel = typeof s.academicLevel === 'string' ? s.academicLevel : '';
    if (academicLevel.trim()) {
      parts.push(`<p><strong>${escapeHtml(labels.academicLevelLabel)}:</strong> ${escapeHtml(academicLevel)}</p>`);
    }

    const macroTopics = Array.isArray(s.macroTopics) ? (s.macroTopics as unknown[]) : [];
    if (macroTopics.length) {
      parts.push(`<h2>${escapeHtml(labels.mainTopicsTitle)}</h2>`);
      for (const mtRaw of macroTopics) {
        const mt = (mtRaw ?? {}) as Record<string, unknown>;
        parts.push('<div class="mt-3 mb-2">');
        const mtName = typeof mt.name === 'string' ? mt.name : undefined;
        const mtImportance = typeof mt.importance === 'string' ? mt.importance : undefined;
        if (mtName) {
          const badge = mtImportance
            ? ` <span class="inline-block align-middle rounded-full border px-2 py-[2px] text-[10px] ml-2">${escapeHtml(mtImportance)}</span>`
            : '';
          parts.push(`<h3 class="!mt-0">${escapeHtml(mtName)}${badge}</h3>`);
        }
        const mtDesc = typeof mt.description === 'string' ? mt.description : undefined;
        if (mtDesc) parts.push(`<p>${escapeHtml(mtDesc)}</p>`);
        const microTopics = Array.isArray(mt.microTopics) ? (mt.microTopics as unknown[]) : [];
        if (microTopics.length) {
          parts.push('<ul>');
          for (const micRaw of microTopics) {
            const mic = (micRaw ?? {}) as Record<string, unknown>;
            parts.push('<li>');
            const micName = typeof mic.name === 'string' ? mic.name : undefined;
            if (micName) parts.push(`<p><strong>${escapeHtml(micName)}</strong></p>`);
            const micDesc = typeof mic.description === 'string' ? mic.description : undefined;
            if (micDesc) parts.push(`<p>${escapeHtml(micDesc)}</p>`);
            const keyTerms = Array.isArray(mic.keyTerms) ? (mic.keyTerms as unknown[]) : [];
            if (keyTerms.length) {
              parts.push(`<p><em>${escapeHtml(labels.keyTermsLabel)}:</em></p><ul>`);
              for (const t of keyTerms) parts.push(`<li>${escapeHtml(String(t as string))}</li>`);
              parts.push('</ul>');
            }
            const concepts = Array.isArray(mic.concepts) ? (mic.concepts as unknown[]) : [];
            if (concepts.length) {
              parts.push(`<p><em>${escapeHtml(labels.conceptsLabel)}:</em></p><ul>`);
              for (const c of concepts) parts.push(`<li>${escapeHtml(String(c as string))}</li>`);
              parts.push('</ul>');
            }
            parts.push('</li>');
          }
          parts.push('</ul>');
        }
        parts.push('</div>');
      }
    }

    if (parts.length === 0) return null;
    return parts.join('\n');
  } catch {
    return null;
  }
}

export function getSummaryDisplayText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val == null) return '';
  if (typeof val !== 'object') return String(val);
  const obj = val as Record<string, unknown>;
  const choices = Array.isArray(obj.choices as unknown[]) ? (obj.choices as unknown[]) : [];
  const firstChoice = (choices[0] as { message?: { content?: unknown } } | undefined)?.message?.content;
  const candidates: unknown[] = [
    obj.summary,
    obj.markdown,
    obj.text,
    obj.content,
    obj.output_text,
    obj.result,
    firstChoice,
  ];
  for (const c of candidates) {
    if (typeof c === 'string') return c;
  }
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}
