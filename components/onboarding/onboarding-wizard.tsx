"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/lib/contexts/onboarding-context";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

// Steps
import { 
  WelcomeStep,
  InstitutionStep,
  SubjectStep,
  GroupStep,
  StudentsStep,
  ExamOptionsStep,
} from "./steps";

interface InstitutionData {
  id?: string;
  name: string;
  type: string;
}

interface SubjectData {
  id?: string;
  name: string;
  description?: string;
}

interface GroupData {
  id?: string;
  name: string;
  year?: string;
  period?: string;
}

interface StudentData {
  id?: string;
  firstName: string;
  lastName: string;
  identification: string;
}

export interface WizardData {
  institution?: InstitutionData;
  subject?: SubjectData;
  group?: GroupData;
  students?: StudentData[];
}

const TOTAL_STEPS = 6;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const { shouldShowWizard, skipWizard, completeWizardStep, dismissWizard } = useOnboarding();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setIsSubmitting(true);
      try {
        await completeWizardStep(currentStep);
        setCurrentStep(prev => prev + 1);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, completeWizardStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    await skipWizard("user_skipped");
  }, [skipWizard]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await completeWizardStep(TOTAL_STEPS - 1);
    } finally {
      setIsSubmitting(false);
    }
  }, [completeWizardStep]);

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <InstitutionStep
            data={wizardData.institution}
            onUpdate={(data: InstitutionData) => updateWizardData({ institution: data })}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <SubjectStep
            institutionName={wizardData.institution?.name}
            institutionId={wizardData.institution?.id}
            data={wizardData.subject}
            onUpdate={(data: SubjectData) => updateWizardData({ subject: data })}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <GroupStep
            subjectName={wizardData.subject?.name}
            subjectId={wizardData.subject?.id}
            data={wizardData.group}
            onUpdate={(data: GroupData) => updateWizardData({ group: data })}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <StudentsStep
            groupId={wizardData.group?.id}
            data={wizardData.students}
            onUpdate={(data: StudentData[]) => updateWizardData({ students: data })}
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return (
          <ExamOptionsStep
            subjectId={wizardData.subject?.id}
            groupId={wizardData.group?.id}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  if (!shouldShowWizard) {
    return null;
  }

  return (
    <Dialog open={shouldShowWizard}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden p-0" 
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{t("wizard.title")}</DialogTitle>
        </VisuallyHidden>
        {/* Header with progress */}
        <div className="p-6 pb-4 border-b">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("wizard.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("wizard.subtitle")}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("wizard.step", { current: currentStep + 1, total: TOTAL_STEPS })}
              </span>
              <span className="text-muted-foreground">
                {t("wizard.progress", { percent: Math.round(progressPercent) })}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        {/* Footer navigation */}
        {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
          <div className="p-6 pt-4 border-t flex justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("wizard.back")}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                {t("wizard.skip")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
