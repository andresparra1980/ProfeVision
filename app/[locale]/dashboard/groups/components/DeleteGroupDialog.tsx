"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriangleAlert, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import logger from "@/lib/utils/logger";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
  groupName: string | null;
  onSuccess: () => void;
  onError: (context: string, error: unknown) => void;
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  onSuccess,
  onError
}: DeleteGroupDialogProps) {
  const t = useTranslations('dashboard.groups');
  const [typedGroupName, setTypedGroupName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setTypedGroupName("");
  };

  const confirmDelete = async () => {
    if (!groupId) return;

    setIsDeleting(true);
    logger.log(`[DeleteGroupDialog] Attempting to delete group ID: ${groupId}`);

    try {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast.success(t('toast.deleteTitle'), {
        description: t('toast.deleteDescription'),
      });

      handleClose();
      onSuccess();
    } catch (error: unknown) {
      onError(t('error.deletingGroup'), error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
      modal={true}
    >
      <DialogContent
        className="sm:max-w-md border-red-500 dark:border-red-700 shadow-xl rounded-lg bg-card dark:bg-background"
        onCloseAutoFocus={(e) => {
          // Prevent focus trap issues
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400 text-2xl font-bold flex items-center">
            <TriangleAlert className="h-7 w-7 mr-2 text-red-600 dark:text-red-400" />
            {t('deleteDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="text-gray-600 dark:text-white">
          <p>
            {t('deleteDialog.mainMessage')} {" "}
            <span className="font-semibold">{groupName || t('deleteDialog.selectedGroup')}</span>.
          </p>
          <p>
            {t('deleteDialog.irreversible')} <span className="font-semibold uppercase">{t('deleteDialog.irreversibleText')}</span> {t('deleteDialog.resultingIn')}:
          </p>
          <ul className="list-disc list-inside ml-4 text-sm mt-2">
            <li>{t('deleteDialog.consequence1')}</li>
            <li>{t('deleteDialog.consequence2')}</li>
            <li>{t('deleteDialog.consequence3')}</li>
            <li>{t('deleteDialog.consequence4')}</li>
          </ul>
          <p className="mt-3">
            {t('deleteDialog.confirmMessage')}
          </p>
          <p className="mt-3">
            {t('deleteDialog.archiveAlternative')} <span className="font-semibold">{t('deleteDialog.archiveText')}</span> {t('deleteDialog.archiveReason')}
          </p>
        </div>
        <div className="grid gap-3 py-3">
          <Label htmlFor="group-confirm-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('deleteDialog.typePrompt')} &quot;<span className="font-semibold text-red-600 dark:text-red-400">{groupName}</span>&quot; {t('deleteDialog.typeConfirm')}:
          </Label>
          <Input
            id="group-confirm-name"
            value={typedGroupName}
            onChange={(e) => setTypedGroupName(e.target.value)}
            placeholder={t('deleteDialog.placeholder')}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500"
            autoFocus
            disabled={isDeleting}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            {t('deleteDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={typedGroupName !== groupName || isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('deleteDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
