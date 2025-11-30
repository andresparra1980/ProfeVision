"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sparkles, Upload, PenLine, Compass, FileText } from "lucide-react";

interface ExamOptionsStepProps {
  subjectId?: string;
  groupId?: string;
  onComplete: () => void;
  isSubmitting: boolean;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}

function OptionCard({ icon, title, description, badge, onClick, disabled }: OptionCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export function ExamOptionsStep({ subjectId, onComplete, isSubmitting }: ExamOptionsStepProps) {
  const t = useTranslations("onboarding.examOptions");
  const router = useRouter();

  const handleAICreate = async () => {
    await onComplete();
    // Navigate to AI chat for exam creation
    const params = new URLSearchParams();
    params.set("mode", "ai");
    if (subjectId) params.set("materia", subjectId);
    router.push(`/dashboard/exams/create?${params.toString()}` as "/dashboard/exams/create");
  };

  const handleImport = async () => {
    await onComplete();
    const params = new URLSearchParams();
    params.set("mode", "import");
    if (subjectId) params.set("materia", subjectId);
    router.push(`/dashboard/exams/create?${params.toString()}` as "/dashboard/exams/create");
  };

  const handleManual = async () => {
    await onComplete();
    if (subjectId) {
      router.push(`/dashboard/exams/create?materia=${subjectId}` as "/dashboard/exams/create");
    } else {
      router.push("/dashboard/exams/create");
    }
  };

  const handleExplore = async () => {
    await onComplete();
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        <OptionCard
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          title={t("aiOption.title")}
          description={t("aiOption.description")}
          badge={t("aiOption.badge")}
          onClick={handleAICreate}
          disabled={isSubmitting}
        />
        
        <OptionCard
          icon={<Upload className="h-5 w-5 text-primary" />}
          title={t("importOption.title")}
          description={t("importOption.description")}
          onClick={handleImport}
          disabled={isSubmitting}
        />
        
        <OptionCard
          icon={<PenLine className="h-5 w-5 text-primary" />}
          title={t("manualOption.title")}
          description={t("manualOption.description")}
          onClick={handleManual}
          disabled={isSubmitting}
        />
        
        <OptionCard
          icon={<Compass className="h-5 w-5 text-primary" />}
          title={t("exploreOption.title")}
          description={t("exploreOption.description")}
          onClick={handleExplore}
          disabled={isSubmitting}
        />
      </div>

      {/* Skip button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="ghost"
          onClick={handleExplore}
          disabled={isSubmitting}
          className="text-muted-foreground"
        >
          {isSubmitting ? "Completando..." : t("exploreOption.title")}
        </Button>
      </div>
    </div>
  );
}
