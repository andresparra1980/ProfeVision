"use client";

import { useState, useRef } from "react";
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
  const finalTitle = title ?? t('title');
  const finalDescription = description ?? t('description');

  const handleCopy = async () => {
    try {
      // Prefer rich copy for Word: provide both text/html and text/plain
      type ClipboardItemConstructor = new (_items: Record<string, Blob>) => ClipboardItem;
      const canRichCopy =
        typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!htmlContent &&
        "ClipboardItem" in window &&
        "clipboard" in navigator &&
        typeof (navigator.clipboard as unknown as { write?: unknown }).write === "function";

      if (canRichCopy) {
        const ClipboardItemCtor = (window as unknown as { ClipboardItem: ClipboardItemConstructor }).ClipboardItem;
        const data: ClipboardItem[] = [
          new ClipboardItemCtor({
            "text/html": new Blob([htmlContent!], { type: "text/html" }),
            "text/plain": new Blob([content], { type: "text/plain" }),
          }),
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
          <textarea
            ref={textareaRef}
            readOnly
            value={content}
            onClick={handleCopy}
            className="w-full h-[380px] rounded-md border p-3 font-mono text-sm whitespace-pre leading-6 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
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

