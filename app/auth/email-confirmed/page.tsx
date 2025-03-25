"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailConfirmedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">¡Email Verificado!</CardTitle>
          <CardDescription>
            Tu dirección de correo electrónico ha sido verificada correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Ahora puedes iniciar sesión en tu cuenta y comenzar a utilizar todas las funcionalidades de ProfeVision.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">
              Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 