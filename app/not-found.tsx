import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/shared/mode-toggle';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 text-center">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      
      <div className="space-y-6 max-w-md">
        <h1 className="text-5xl font-extrabold">404</h1>
        <h2 className="text-2xl font-bold">Página no encontrada</h2>
        <p className="text-muted-foreground">
          Lo sentimos, no pudimos encontrar la página que estás buscando.
        </p>
        
        <div className="pt-6">
          <Button asChild>
            <Link href="/">
              Regresar al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 