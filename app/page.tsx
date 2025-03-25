import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
      <div className="z-10 w-full max-w-5xl flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6">
          Bienvenido a <span className="text-primary">ProfeVision</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-3xl">
          Transforma la forma en que creas, administras y calificas exámenes. Una plataforma integral para profesores e instituciones educativas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/auth/login">
              Iniciar Sesión
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/register">
              Registrarse
            </Link>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="8" height="14" x="8" y="5" rx="1" />
                <path d="M4 5v14" />
                <path d="M20 5v14" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Creación de Exámenes</h3>
            <p className="text-center text-muted-foreground">
              Genera exámenes personalizados con nuestra asistencia de IA. Múltiples formatos, preguntas de calidad y plantillas reutilizables.
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15v-6" />
                <path d="M12 12v3" />
                <path d="M15 9v6" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Calificación Automática</h3>
            <p className="text-center text-muted-foreground">
              Califica exámenes en segundos con tu smartphone. Reconocimiento automático de respuestas y exportación de calificaciones.
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Análisis de Resultados</h3>
            <p className="text-center text-muted-foreground">
              Obtén insights valiosos sobre el desempeño de tus estudiantes. Identifica áreas de mejora y tendencias con nuestros reportes detallados.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 