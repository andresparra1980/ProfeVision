import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/contexts/sidebar-context';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  const { isOpen } = useSidebar();

  // No mostrar la bottom bar si el sidebar está abierto en mobile
  if (isOpen) {
    return null;
  }

  return (
    // Bottom bar fija para mobile, oculta en desktop
    <div className="fixed bottom-0 left-0 w-full bg-background/50 backdrop-blur-sm border-t border-border shadow-lg md:hidden z-[9999]">
      <div className="flex justify-center py-4 px-4 safe-area-pb">
        <Button
          onClick={onClick}
          className="h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center gap-2 px-6 font-medium"
        >
          <Camera className="h-5 w-5" />
          ¡Califica Ya!
        </Button>
      </div>
    </div>
  );
} 