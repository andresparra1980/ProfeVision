
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ScanWizard } from '@/components/exam/scan-wizard'


// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'titles.instructions': 'Instructions Title',
      'titles.imageCapture': 'Capture Title',
      'titles.processing': 'Processing Title',
      'titles.results': 'Results Title',
      'titles.saved': 'Saved Title',
      'buttons.close': 'Close',
      'buttons.back': 'Back',
      'description': 'Wizard Description'
    }
    return translations[key] || key
  },
}))

// Mock wizard-steps components
vi.mock('@/components/exam/wizard-steps', () => ({
  Instructions: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="step-instructions">
      <button onClick={onNext}>Start Scan</button>
    </div>
  ),
  ImageCapture: ({ onCapture }: { onCapture: (file: File) => void }) => (
    <div data-testid="step-capture">
      <button onClick={() => onCapture(new File([''], 'test.jpg', { type: 'image/jpeg' }))}>
        Capture Image
      </button>
    </div>
  ),
  Processing: () => <div data-testid="step-processing">Processing...</div>,
  Results: ({ onSaved }: { onSaved: (id: string) => void }) => (
    <div data-testid="step-results">
      <button onClick={() => onSaved('result-123')}>Save Result</button>
    </div>
  ),
  Confirmation: ({ onFinish }: { onFinish: () => void }) => (
    <div data-testid="step-confirmation">
      <button onClick={onFinish}>Finish</button>
    </div>
  ),
}))

// Mock contexts
const mockSetOnProcessingComplete = vi.fn()
const mockClearImageData = vi.fn()

let mockProcessedImageData: string | null = null

const mockSetProcessedImageData = vi.fn((data) => {
  mockProcessedImageData = data
})

vi.mock('@/components/exam/contexts', () => ({
  ImageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useImageContext: () => ({
    setProcessedImageData: mockSetProcessedImageData,
    setOnProcessingComplete: mockSetOnProcessingComplete,
    clearImageData: mockClearImageData,
    processedImageData: mockProcessedImageData,
    finalOutput: null
  }),
}))

// Mock useTierLimits
const mockCanUseScan = vi.fn()
vi.mock('@/lib/hooks/useTierLimits', () => ({
  useTierLimits: () => ({
    usage: { scans: { used: 0, limit: 100 }, cycle: { daysUntilReset: 10 } },
    loading: false,
    canUseScan: mockCanUseScan,
  }),
}))

// Mock LimitReachedModal
vi.mock('@/components/shared/limit-reached-modal', () => ({
  LimitReachedModal: ({ open }: { open: boolean }) => (
    open ? <div data-testid="limit-modal">Limit Reached</div> : null
  ),
}))

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

describe('ScanWizard', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCanUseScan.mockReturnValue(true)
    mockProcessedImageData = null
  })

  it('renders instructions step initially', () => {
    render(<ScanWizard {...defaultProps} />)
    expect(screen.getByTestId('step-instructions')).toBeInTheDocument()
    expect(screen.getByText('Instructions Title')).toBeInTheDocument()
  })

  it('navigates to capture step when limit is not reached', () => {
    mockCanUseScan.mockReturnValue(true)
    render(<ScanWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Start Scan'))

    expect(screen.getByTestId('step-capture')).toBeInTheDocument()
    expect(screen.getByText('Capture Title')).toBeInTheDocument()
  })

  it('shows limit modal when limit is reached', () => {
    mockCanUseScan.mockReturnValue(false)
    render(<ScanWizard {...defaultProps} />)

    fireEvent.click(screen.getByText('Start Scan'))

    expect(screen.getByTestId('limit-modal')).toBeInTheDocument()
    expect(screen.queryByTestId('step-capture')).not.toBeInTheDocument()
  })

  it('handles image capture and moves to processing', async () => {
    // Setup FileReader mock
    // @ts-ignore
    global.FileReader = class {
      onload: any = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } })
          }
        }, 10)
      }
    }

    render(<ScanWizard {...defaultProps} />)
    
    // Step 1 -> 2
    fireEvent.click(screen.getByText('Start Scan'))
    
    // Step 2 -> 3 (Capture)
    fireEvent.click(screen.getByText('Capture Image'))
    
    await waitFor(() => {
        expect(screen.getByTestId('step-processing')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Processing Title')).toBeInTheDocument()
  })

  it('handles save and moves to confirmation', async () => {
    // Setup FileReader mock
    // @ts-ignore
    global.FileReader = class {
      onload: any = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } })
          }
        }, 10)
      }
    }

    render(<ScanWizard {...defaultProps} />)
    
    // 1 -> 2
    fireEvent.click(screen.getByText('Start Scan'))
    // 2 -> 3
    fireEvent.click(screen.getByText('Capture Image'))

    // Wait for FileReader logic to set state and move to 3
    await waitFor(() => {
        expect(screen.getByTestId('step-processing')).toBeInTheDocument()
    })

    // NOTE: In the real component, `Processing` step doesn't auto-advance to `Results`
    // unless `finalOutput` changes or `setOnProcessingComplete` callback is triggered.
    // Our mock `Processing` component just renders text.
    // The `ScanWizardContent` logic sets up a listener for `setOnProcessingComplete`.
    
    // To properly test 3->4 transition, we need to trigger the callback passed to `setOnProcessingComplete`.
    // We can do this by getting the mock call argument.
    
    // ScanWizard calls setOnProcessingComplete with a factory function
    const processingCallbackFactory = mockSetOnProcessingComplete.mock.calls[0][0]
    const processingCallback = processingCallbackFactory()
    
    // Trigger completion
    act(() => {
        processingCallback({
            processedImage: 'processed.jpg',
            qrData: 'qr-123',
            answers: []
        })
    })

    // Now it should be on Step 4 (Results)
    await waitFor(() => {
        expect(screen.getByTestId('step-results')).toBeInTheDocument()
    })
    
    // 4 -> 5 (Save)
    fireEvent.click(screen.getByText('Save Result'))
    
    expect(screen.getByTestId('step-confirmation')).toBeInTheDocument()
    expect(screen.getByText('Saved Title')).toBeInTheDocument()
  })
})
