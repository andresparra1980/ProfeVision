import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="absolute bottom-6 right-4 h-14 rounded-full bg-primary hover:bg-primary/90 text-white dark:text-black shadow-lg md:hidden flex items-center gap-2 px-6 z-[9999] pointer-events-auto"
    >
      <Camera className="h-5 w-5" />
      ¡Califica Ya!
    </Button>
  );
} 