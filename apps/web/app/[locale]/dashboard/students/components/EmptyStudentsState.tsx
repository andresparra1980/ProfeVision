"use client";

import { BookOpen, Users, UserPlus, Folders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface EmptyStudentsStateProps {
  hasGroups: boolean;
  hasStudents: boolean;
  onCreateStudent: () => void;
  onManageGroups: () => void;
}

export function EmptyStudentsState({
  hasGroups,
  hasStudents,
  onCreateStudent,
  onManageGroups
}: EmptyStudentsStateProps) {
  const t = useTranslations('dashboard.students');

  // No groups exist
  if (!hasGroups) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('empty.noGroups.title')}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {t('empty.noGroups.description')}
        </p>
        <Button
          variant="default"
          onClick={onManageGroups}
          className="bg-secondary text-primary-foreground dark:bg-secondary dark:text-white transition-colors w-full sm:w-auto"
        >
          <Folders className="mr-2 h-4 w-4" /> {t('empty.noGroups.createGroup')}
        </Button>
      </div>
    );
  }

  // Groups exist but no students
  if (!hasStudents) {
    return (
      <div className="py-8 text-center">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('empty.noStudents.title')}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {t('empty.noStudents.description')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <Button
            onClick={onCreateStudent}
            variant="outline"
          >
            <UserPlus className="mr-2 h-4 w-4" /> {t('empty.noStudents.createStudent')}
          </Button>
          <Button
            onClick={onManageGroups}
            className="bg-secondary text-primary-foreground dark:bg-secondary dark:text-white transition-colors w-full sm:w-auto"
          >
            <Folders className="mr-2 h-4 w-4" /> {t('empty.noStudents.manageGroups')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
