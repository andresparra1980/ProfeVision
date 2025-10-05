import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClearChatDialogProps {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  onConfirm: () => void;
  clearing: boolean;
}

export function ClearChatDialog({
  open,
  onOpenChange,
  onConfirm,
  clearing,
}: ClearChatDialogProps) {
  const t = useTranslations("ai_exams_chat");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("clearDialog.title")}</DialogTitle>
          <DialogDescription>{t("clearDialog.description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={clearing}
          >
            {t("clearDialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={clearing}>
            {clearing ? "…" : t("clearDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
