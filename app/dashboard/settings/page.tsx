"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    biografia: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data, error } = await supabase
          .from("profesores")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfileData({
            nombres: data.nombres || "",
            apellidos: data.apellidos || "",
            email: session.user.email || "",
            telefono: data.telefono || "",
            biografia: data.biografia || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Actualizar datos de autenticación
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: `${profileData.nombres} ${profileData.apellidos}`,
          name: `${profileData.nombres} ${profileData.apellidos}`,
        },
      });

      if (authError) throw authError;

      // Actualizar datos del profesor
      const { error: updateError } = await supabase
        .from("profesores")
        .update({
          nombres: profileData.nombres,
          apellidos: profileData.apellidos,
          telefono: profileData.telefono || null,
          biografia: profileData.biografia || null,
        })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados correctamente",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Administra tu perfil y ajustes de la plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil de Profesor</CardTitle>
          <CardDescription>
            Actualiza tu información personal y de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                value={profileData.nombres}
                onChange={(e) =>
                  setProfileData({ ...profileData, nombres: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                value={profileData.apellidos}
                onChange={(e) =>
                  setProfileData({ ...profileData, apellidos: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede cambiar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={profileData.telefono}
              onChange={(e) =>
                setProfileData({ ...profileData, telefono: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biografia">Biografía</Label>
            <Textarea
              id="biografia"
              value={profileData.biografia}
              onChange={(e) =>
                setProfileData({ ...profileData, biografia: e.target.value })
              }
              disabled={loading}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Cambiar Contraseña</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Las preferencias de notificaciones estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 