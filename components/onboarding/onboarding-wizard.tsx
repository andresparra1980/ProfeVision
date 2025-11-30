"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
  CompletionStep,
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
  firstName: string | null;
  lastName: string;
  identification: string;
}

export interface WizardData {
  institution?: InstitutionData;
  subject?: SubjectData;
  group?: GroupData;
  students?: StudentData[];
}

const TOTAL_STEPS = 7;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const { shouldShowWizard, completeWizardStep, onboardingStatus } = useOnboarding();
  
  // Initialize step from DB status, default to 0
  const initialStep = onboardingStatus?.wizard_step ?? 0;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sync with DB when onboardingStatus loads
  useEffect(() => {
    if (onboardingStatus?.wizard_step !== undefined && onboardingStatus.wizard_step !== currentStep) {
      setCurrentStep(onboardingStatus.wizard_step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStatus?.wizard_step]);

  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setIsSubmitting(true);
      try {
        const nextStep = currentStep + 1;
        await completeWizardStep(nextStep);
        setCurrentStep(nextStep);
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
            onComplete={handleNext}
            isSubmitting={isSubmitting}
          />
        );
      case 6:
        return (
          <CompletionStep
            onCompleteAction={handleComplete}
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
        className="max-w-2xl max-h-[90vh] overflow-hidden p-0 md:max-w-2xl md:max-h-[90vh] max-md:!fixed max-md:!inset-0 max-md:!translate-x-0 max-md:!translate-y-0 max-md:!top-0 max-md:!left-0 max-md:w-screen max-md:h-[100dvh] max-md:max-w-none max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:!z-[10000] max-md:flex max-md:flex-col" 
        hideCloseButton
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{t("wizard.title")}</DialogTitle>
          <DialogDescription>{t("wizard.subtitle")}</DialogDescription>
        </VisuallyHidden>
        {/* Header with progress - fixed height, never scrolls */}
        <div className="p-4 md:p-6 pb-4 border-b flex-shrink-0">
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

        {/* Step content - scrollable, takes remaining space */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 min-h-0">
          {renderStep()}
        </div>

        {/* Footer navigation - fixed height, never scrolls */}
        {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
          <div className="p-4 md:p-6 pt-4 border-t flex justify-between flex-shrink-0">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("wizard.back")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
