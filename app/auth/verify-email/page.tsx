import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Verifica tu correo electrónico</h1>
          <p className="text-muted-foreground">
            Hemos enviado un enlace de confirmación a tu dirección de correo electrónico.
            Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el registro.
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Si no has recibido el correo en unos minutos, revisa tu carpeta de spam
            o solicita un nuevo enlace de verificación.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              Volver a iniciar sesión
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 