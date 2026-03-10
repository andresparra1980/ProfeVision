"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import "katex/dist/katex.min.css";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MathText from "@/components/MathText";
import { Check, Clipboard } from "lucide-react";

interface TextExportDialogProps {
  _open: boolean;
  onOpenChange: (_open: boolean) => void;
  content: string;
  htmlContent?: string;
  title?: string;
  description?: string;
}

export default function TextExportDialog({
  _open,
  onOpenChange,
  content,
  htmlContent,
  title,
  description,
}: TextExportDialogProps) {
  const t = useTranslations('dashboard.exams.textExport');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const finalTitle = title ?? t('title');
  const finalDescription = description ?? t('description');
  
  // Normalize common artifacts that sometimes come mixed (e.g., "Δx\\Delta xΔx")
  const cleanedContent = useMemo(() => {
    let s = content ?? "";
    // Normalize escaped backslashes
    s = s.replace(/\\\\/g, "\\");
    // Convert \( ... \) and \[ ... \] to $ ... $ and $$ ... $$ so remark-math picks them up
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${inner}$$`);
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner}$`);
    // Collapse known duplicated patterns (unicode + TeX + unicode) to pure TeX
    s = s.replace(/Δx\\Delta xΔx/g, "$\\Delta x$");
    s = s.replace(/Δp\\Delta pΔp/g, "$\\Delta p$");
    s = s.replace(/ℏ\\hbarℏ/g, "$\\hbar$");
    s = s.replace(/kBk_BkB\u200b?/g, "$k_B$");
    s = s.replace(/\bccc\b/g, "$c$");
    s = s.replace(/\beee\b/g, "$e$");
    return s;
  }, [content]);
  
  // Add new lines for readability: line-break before questions (1., 2., ...) and options (a., b., ...)
  const formattedContent = useMemo(() => {
    let s = cleanedContent ?? "";
    // 1) Protect inline math segments so we don't insert breaks inside them
    const mathSegments: string[] = [];
    s = s.replace(/\$[^$]+\$/g, (match) => {
      const idx = mathSegments.push(match) - 1;
      return `%%MATH_${idx}%%`;
    });

    // 2) New lines before question numbers (only when at start or after a newline)
    s = s.replace(/(^|\n)\s*(\d+\.)\s/g, (m, pfx, num) => `${pfx}\n\n${num} `);

    // 3) New lines before options a./b./c./d. with strict boundary (avoid words like "la.")
    // Use lookbehind for non-letter or start
    try {
      s = s.replace(/(?<=^|[^A-Za-zÁÉÍÓÚáéíóúñÑ])([a-d])\.\s/g, `\n$1. `);
    } catch {
      // Fallback without lookbehind: replace only when preceded by space/newline/punctuation we add back
      s = s.replace(/(^|[\s\n\r)\]:])([a-d])\.\s/g, (_m, pfx, letter) => `${pfx}\n${letter}. `);
    }

    // 4) Normalize excessive line breaks
    s = s.replace(/\n{3,}/g, '\n\n').trim();

    // 5) Restore math segments
    s = s.replace(/%%MATH_(\d+)%%/g, (_, i) => mathSegments[Number(i)] || "");
    return s;
  }, [cleanedContent]);
  // Always render the plain text version with MathText so LaTeX is processed consistently

  // As a safety net, run KaTeX auto-render on the preview if for any reason inline math was not processed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!previewRef.current) return;
      // If already rendered by MathText, skip
      if (previewRef.current.querySelector('.katex')) return;
      try {
        type AutoRenderOptions = {
          delimiters: Array<{ left: string; right: string; display: boolean }>;
          throwOnError: boolean;
        };
        type AutoRenderModule = {
          default?: (_el: HTMLElement, _opts: AutoRenderOptions) => void;
          renderMathInElement?: (_el: HTMLElement, _opts: AutoRenderOptions) => void;
        };
        const mod = (await import('katex/contrib/auto-render')) as AutoRenderModule;
        const renderMathInElement = mod.default ?? mod.renderMathInElement;
        if (cancelled || !previewRef.current) return;
        if (renderMathInElement) renderMathInElement(previewRef.current as unknown as HTMLElement, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (_error) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [formattedContent]);

  const handleCopy = async () => {
    try {
      // Prefer rich copy for Word: provide both text/html and text/plain
      type ClipboardItemConstructor = new (_items: Record<string, Blob>) => ClipboardItem;
      const canRichCopy =
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        "ClipboardItem" in window &&
        typeof (window as unknown as { ClipboardItem?: unknown }).ClipboardItem === "function";

      if (canRichCopy) {
        const ClipboardItemCtor = (window as unknown as { ClipboardItem: ClipboardItemConstructor }).ClipboardItem;
        // Copy exactly what is rendered on screen (MathText output) but remove KaTeX MathML/annotation
        let htmlSource = formattedContent;
        if (previewRef.current) {
          const clone = previewRef.current.cloneNode(true) as HTMLElement;
          // Remove KaTeX MathML and <annotation> (these cause duplicated TeX when pasting in Word)
          clone.querySelectorAll('.katex-mathml, math, annotation').forEach((el) => el.parentNode?.removeChild(el));
          htmlSource = clone.innerHTML || formattedContent;
        }
        const htmlBlob = new Blob([htmlSource], { type: "text/html" });
        const textBlob = new Blob([formattedContent], { type: "text/plain" });
        await (navigator.clipboard as unknown as { write: (_data: ClipboardItem[]) => Promise<void> }).write([
          new ClipboardItemCtor({ "text/html": htmlBlob, "text/plain": textBlob }),
        ]);
      } else {
        await (navigator.clipboard as unknown as { writeText: (_text: string) => Promise<void> }).writeText(content);
      }
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // fallback selection if clipboard API fails
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <Dialog open={_open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{finalTitle}</span>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> {t('statuses.copied')}
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 mr-1" /> {t('buttons.copyAll')}
                </>
              )}
            </Button>
          </DialogTitle>
          <DialogDescription>{finalDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            ref={previewRef}
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }}
            className="h-[380px] w-full cursor-pointer overflow-auto rounded-2xl border bg-background p-4 text-sm prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-primary/50 dark:prose-invert"
          >
            <MathText text={formattedContent} />
          </div>
          {!htmlContent && (
            <textarea
              ref={textareaRef}
              readOnly
              value={formattedContent}
              onClick={handleCopy}
              className="h-24 w-full rounded-xl border p-3 font-mono text-xs leading-5 whitespace-pre focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {t('tips.wordList')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
          <Button onClick={handleCopy}>{copied ? t('toasts.copied') : t('actions.copy')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
