"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useProfesor } from "@/lib/hooks/useProfesor";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  biografia: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { profesor, loading: profesorLoading, updateProfesor } = useProfesor();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
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
      form.setValue("fullName", profesor.nombre_completo);
      form.setValue("telefono", profesor.telefono || "");
      form.setValue("cargo", profesor.cargo || "");
      form.setValue("biografia", profesor.biografia || "");
    }
  }, [profesor, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      // Actualizar datos de autenticación (display name)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          name: data.fullName,
        },
      });

      if (authError) {
        throw authError;
      }

      // Actualizar datos específicos del profesor
      const { success, error: profesorError } = await updateProfesor({
        nombre_completo: data.fullName,
        telefono: data.telefono || null,
        cargo: data.cargo || null,
        biografia: data.biografia || null,
      });

      if (!success && profesorError) {
        throw profesorError;
      }

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente.",
      });
      
      // Trigger refresh to update display name in header
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar perfil",
        description: error.message || "Ha ocurrido un error. Intenta nuevamente.",
      });
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
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                disabled={isLoading}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
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