"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyEntitiesStateProps {
  onCreateEntity: () => void;
}

export function EmptyEntitiesState({ onCreateEntity }: EmptyEntitiesStateProps) {
  const t = useTranslations('dashboard.entities');

  return (
    <Card className="mt-4">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground mb-4">
          {t('noEntitiesMessage')}
        </p>
        <Button onClick={onCreateEntity}>
          <Plus className="mr-2 h-4 w-4" /> {t('addFirstEntity')}
        </Button>
      </CardContent>
    </Card>
  );
}
