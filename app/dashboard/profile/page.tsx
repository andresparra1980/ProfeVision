"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { useRouter } from "next/navigation";
import { useProfesor } from "@/lib/hooks/useProfesor";
import type { User } from "@supabase/supabase-js";

const profileSchema = z.object({
  nombres: z.string().min(2, { message: "Los nombres deben tener al menos 2 caracteres" }),
  apellidos: z.string().min(2, { message: "Los apellidos deben tener al menos 2 caracteres" }),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  biografia: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { profesor, loading: profesorLoading, error: profesorError, updateProfesor } = useProfesor();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      telefono: "",
      cargo: "",
      biografia: "",
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (profesor) {
      form.setValue("nombres", profesor.nombres);
      form.setValue("apellidos", profesor.apellidos);
      form.setValue("telefono", profesor.telefono || "");
      form.setValue("cargo", profesor.cargo || "");
      form.setValue("biografia", profesor.biografia || "");
    }
  }, [profesor, form]);

  // Helper function for consistent error logging
  const handleSupabaseError = useCallback((context: string, error: unknown) => {
    const errorObj = error as Error;
    const isSupabaseError = typeof errorObj === 'object' && errorObj !== null;
    // Safely access status, code, and details
    let status: number | undefined = undefined;
    let code: string | undefined = undefined;
    let details: string | undefined = undefined;

    if (isSupabaseError) {
      if ('status' in errorObj) {
        status = Number((errorObj as { status?: unknown }).status);
      }
      if ('code' in errorObj) {
        code = String((errorObj as { code?: unknown }).code);
      }
      if ('details' in errorObj) {
        details = String((errorObj as { details?: unknown }).details);
      }
    }

    logger.error(`[ProfilePage] ${context}:`, { 
      message: errorObj.message, 
      status: status,
      code: code,
      details: details,
      errorObject: errorObj 
    });
    
    toast({ 
      variant: "destructive", 
      title: `Error en ${context}`, 
      description: `Error: ${errorObj?.message || 'Desconocido'}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`
    });
  }, []);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    logger.log('[ProfilePage] Submitting profile update...');
    try {
      // Actualizar datos de autenticación (display name)
      logger.log('[ProfilePage] Updating auth user data...');
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: `${data.nombres} ${data.apellidos}`,
          name: `${data.nombres} ${data.apellidos}`,
        },
      });

      if (authError) {
        // Throw error to be caught by the main catch block
        throw authError;
      }
      logger.log('[ProfilePage] Auth user data updated.');

      // Actualizar datos específicos del profesor
      logger.log('[ProfilePage] Updating profesor data...');
      const { success, error: profesorUpdateError } = await updateProfesor({
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono || null,
        cargo: data.cargo || null,
        biografia: data.biografia || null,
      });

      if (!success && profesorUpdateError) {
        // Throw error to be caught by the main catch block
        throw profesorUpdateError;
      }
      logger.log('[ProfilePage] Profesor data updated.');

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente.",
      });
      
      router.refresh();
    } catch (error: unknown) {
      // Use the helper function for any error during the process
      handleSupabaseError('al actualizar perfil', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (profesorLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profesorError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Error al cargar el perfil: {profesorError.message}</p>
      </div>
    );
  }

  if (!profesor && !user) {
    return <div className="flex h-full items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>
            Actualiza tus datos de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                El correo electrónico no se puede cambiar
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  {...form.register("nombres")}
                  disabled={isLoading}
                />
                {form.formState.errors.nombres && (
                  <p className="text-sm text-destructive">{form.formState.errors.nombres.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  {...form.register("apellidos")}
                  disabled={isLoading}
                />
                {form.formState.errors.apellidos && (
                  <p className="text-sm text-destructive">{form.formState.errors.apellidos.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...form.register("telefono")}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                placeholder="Ej: Profesor de Matemáticas"
                {...form.register("cargo")}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="biografia">Biografía</Label>
              <Textarea
                id="biografia"
                placeholder="Breve descripción sobre ti"
                className="min-h-32"
                {...form.register("biografia")}
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 