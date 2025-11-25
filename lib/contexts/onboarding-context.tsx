"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { OnboardingStatus } from "@/lib/types/database";

type ChecklistItem = 'exam_created' | 'exam_published' | 'pdf_exported' | 'first_scan';

interface OnboardingState {
  isLoading: boolean;
  isLegacyUser: boolean;
  firstLoginCompleted: boolean | null;
  onboardingStatus: OnboardingStatus | null;
  shouldShowWizard: boolean;
  checklistComplete: boolean;
  error: string | null;
}

interface OnboardingContextType extends OnboardingState {
  // Actions
  refetch: () => Promise<void>;
  updateStatus: (status: Partial<OnboardingStatus>) => Promise<boolean>;
  completeWizardStep: (step: number) => Promise<boolean>;
  skipWizard: (reason?: string) => Promise<boolean>;
  completeChecklistItem: (item: ChecklistItem) => Promise<boolean>;
  dismissWizard: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialState: OnboardingState = {
  isLoading: true,
  isLegacyUser: true,
  firstLoginCompleted: null,
  onboardingStatus: null,
  shouldShowWizard: false,
  checklistComplete: false,
  error: null,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/onboarding/status');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, just reset state
          setState({ ...initialState, isLoading: false });
          return;
        }
        throw new Error('Error fetching onboarding status');
      }

      const data = await response.json();
      
      setState({
        isLoading: false,
        isLegacyUser: data.is_legacy_user,
        firstLoginCompleted: data.first_login_completed,
        onboardingStatus: data.onboarding_status,
        shouldShowWizard: data.should_show_wizard && !wizardDismissed,
        checklistComplete: data.checklist_complete,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [wizardDismissed]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const updateStatus = useCallback(async (status: Partial<OnboardingStatus>): Promise<boolean> => {
    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
      });

      if (!response.ok) {
        throw new Error('Error updating onboarding status');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        onboardingStatus: data.onboarding_status,
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      return false;
    }
  }, []);

  const completeWizardStep = useCallback(async (step: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'wizard', wizard_step: step }),
      });

      if (!response.ok) {
        throw new Error('Error completing wizard step');
      }

      const data = await response.json();
      const newStatus = data.onboarding_status as OnboardingStatus;
      
      setState(prev => ({
        ...prev,
        onboardingStatus: newStatus,
        shouldShowWizard: !newStatus.wizard_completed,
      }));
      
      return true;
    } catch (error) {
      console.error('Error completing wizard step:', error);
      return false;
    }
  }, []);

  const skipWizard = useCallback(async (reason?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'wizard', skip: true, skip_reason: reason }),
      });

      if (!response.ok) {
        throw new Error('Error skipping wizard');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        onboardingStatus: data.onboarding_status,
        shouldShowWizard: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error skipping wizard:', error);
      return false;
    }
  }, []);

  const completeChecklistItem = useCallback(async (item: ChecklistItem): Promise<boolean> => {
    try {
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'checklist_item', checklist_item: item }),
      });

      if (!response.ok) {
        throw new Error('Error completing checklist item');
      }

      const data = await response.json();
      const newStatus = data.onboarding_status as OnboardingStatus;
      
      setState(prev => ({
        ...prev,
        onboardingStatus: newStatus,
        checklistComplete: newStatus.checklist_items 
          ? Object.values(newStatus.checklist_items).every(Boolean)
          : false,
      }));
      
      return true;
    } catch (error) {
      console.error('Error completing checklist item:', error);
      return false;
    }
  }, []);

  const dismissWizard = useCallback(() => {
    setWizardDismissed(true);
    setState(prev => ({ ...prev, shouldShowWizard: false }));
  }, []);

  const value: OnboardingContextType = {
    ...state,
    shouldShowWizard: state.shouldShowWizard && !wizardDismissed,
    refetch: fetchStatus,
    updateStatus,
    completeWizardStep,
    skipWizard,
    completeChecklistItem,
    dismissWizard,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

/**
 * Hook for tracking a specific onboarding step
 */
export function useOnboardingStep(stepIndex: number) {
  const { onboardingStatus, completeWizardStep } = useOnboarding();
  
  const isCompleted = (onboardingStatus?.wizard_step ?? -1) > stepIndex;
  const isCurrent = onboardingStatus?.wizard_step === stepIndex;
  
  const complete = useCallback(async () => {
    return completeWizardStep(stepIndex);
  }, [completeWizardStep, stepIndex]);
  
  return {
    isCompleted,
    isCurrent,
    complete,
  };
}

/**
 * Hook for tracking checklist items
 */
export function useChecklistItem(item: ChecklistItem) {
  const { onboardingStatus, completeChecklistItem } = useOnboarding();
  
  const isCompleted = onboardingStatus?.checklist_items?.[item] ?? false;
  
  const complete = useCallback(async () => {
    if (isCompleted) return true;
    return completeChecklistItem(item);
  }, [completeChecklistItem, item, isCompleted]);
  
  return {
    isCompleted,
    complete,
  };
}
