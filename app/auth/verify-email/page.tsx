import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Verifica tu correo electrónico</CardTitle>
        <CardDescription className="text-center">
          Hemos enviado un enlace de confirmación a tu dirección de correo electrónico.
          Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el registro.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Si no has recibido el correo en unos minutos, revisa tu carpeta de spam
          o solicita un nuevo enlace de verificación.
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">
            Volver a iniciar sesión
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 