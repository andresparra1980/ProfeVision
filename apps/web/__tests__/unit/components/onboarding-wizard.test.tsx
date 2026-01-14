import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (key === 'wizard.step') return `Step ${params.current} of ${params.total}`
    if (key === 'wizard.progress') return `${params.percent}%`
    return key
  },
}))

// Mock useOnboarding
const mockCompleteWizardStep = vi.fn()
const mockShouldShowWizard = vi.fn()
const mockOnboardingStatus = { wizard_step: 0 }

vi.mock('@/lib/contexts/onboarding-context', () => ({
  useOnboarding: () => ({
    shouldShowWizard: mockShouldShowWizard(),
    completeWizardStep: mockCompleteWizardStep,
    onboardingStatus: mockOnboardingStatus,
  }),
}))

// Mock LanguageSwitcher
vi.mock('@/components/shared/language-switcher-dropdown', () => ({
  LanguageSwitcherDropdownSuspense: () => <div data-testid="lang-switcher">Lang</div>,
}))

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => (
    open ? <div data-testid="wizard-dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress-bar" data-value={value} />,
}))

// Mock Radix VisuallyHidden
vi.mock('@radix-ui/react-visually-hidden', () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Step components
vi.mock('@/components/onboarding/steps', () => ({
  WelcomeStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-welcome">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
  InstitutionStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-institution">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
  SubjectStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-subject">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
  GroupStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-group">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
  StudentsStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-students">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
  CompletionStep: ({ onCompleteAction }: { onCompleteAction: () => void }) => (
    <div data-testid="step-completion">
      <button onClick={onCompleteAction}>Finish Wizard</button>
    </div>
  ),
}))

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShouldShowWizard.mockReturnValue(true)
    mockOnboardingStatus.wizard_step = 0
  })

  it('renders nothing if shouldShowWizard is false', () => {
    mockShouldShowWizard.mockReturnValue(false)
    render(<OnboardingWizard />)
    expect(screen.queryByTestId('wizard-dialog')).not.toBeInTheDocument()
  })

  it('renders nothing if waitForWelcome is true', () => {
    render(<OnboardingWizard waitForWelcome={true} />)
    expect(screen.queryByTestId('wizard-dialog')).not.toBeInTheDocument()
  })

  it('renders the first step (Welcome) initially', () => {
    render(<OnboardingWizard />)
    expect(screen.getByTestId('step-welcome')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
  })

  it('advances to next step on next click', async () => {
    render(<OnboardingWizard />)
    
    fireEvent.click(screen.getByText('Next Step'))
    
    expect(mockCompleteWizardStep).toHaveBeenCalledWith(1)
  })

  it('renders correct step based on initial status', () => {
    mockOnboardingStatus.wizard_step = 2 // Subject Step
    render(<OnboardingWizard />)
    
    expect(screen.getByTestId('step-subject')).toBeInTheDocument()
    expect(screen.getByText('Step 3 of 6')).toBeInTheDocument()
  })

  it('completes the wizard on the final step', () => {
    mockOnboardingStatus.wizard_step = 5 // Completion Step
    render(<OnboardingWizard />)
    
    expect(screen.getByTestId('step-completion')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Finish Wizard'))
    
    // TOTAL_STEPS is 6
    expect(mockCompleteWizardStep).toHaveBeenCalledWith(6)
  })

  it('shows correct progress bar value', () => {
    mockOnboardingStatus.wizard_step = 3 // Group Step (Step 4, index 3)
    render(<OnboardingWizard />)
    
    // 3 / 6 * 100 = 50%
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveAttribute('data-value', '50')
  })
})
