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
      s = s.replace(/(^|[\s\n\r\)\]\:])([a-d])\.\s/g, (m, pfx, letter) => `${pfx}\n${letter}. `);
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
        const mod: any = await import('katex/contrib/auto-render');
        const renderMathInElement = mod?.default || mod?.renderMathInElement;
        if (cancelled || !previewRef.current) return;
        renderMathInElement(previewRef.current as unknown as HTMLElement, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        } as any);
      } catch {
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
        typeof (window as any).ClipboardItem === "function";

      if (canRichCopy) {
        const ClipboardItemCtor = (window as any).ClipboardItem as ClipboardItemConstructor;
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
        const data: ClipboardItem[] = [
          new ClipboardItemCtor({ "text/html": htmlBlob, "text/plain": textBlob }),
        ];
        await (navigator.clipboard as unknown as { write: (_data: ClipboardItem[]) => Promise<void> }).write(data);
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
            className="w-full h-[380px] overflow-auto rounded-md border p-4 text-sm bg-background prose prose-sm dark:prose-invert max-w-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            <MathText text={formattedContent} />
          </div>
          {!htmlContent && (
            <textarea
              ref={textareaRef}
              readOnly
              value={formattedContent}
              onClick={handleCopy}
              className="w-full h-24 rounded-md border p-3 font-mono text-xs whitespace-pre leading-5 focus:outline-none focus:ring-2 focus:ring-primary/50"
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

