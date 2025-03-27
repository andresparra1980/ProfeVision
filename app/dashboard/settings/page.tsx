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
    nombre_completo: "",
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
            nombre_completo: data.nombre_completo || "",
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

  async function updateProfile() {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para actualizar tu perfil",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profesores")
        .update({
          nombre_completo: profileData.nombre_completo,
          telefono: profileData.telefono,
          biografia: profileData.biografia,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
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
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              value={profileData.nombre_completo}
              onChange={(e) =>
                setProfileData({ ...profileData, nombre_completo: e.target.value })
              }
              disabled={loading}
            />
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
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              rows={4}
              value={profileData.biografia}
              onChange={(e) =>
                setProfileData({ ...profileData, biografia: e.target.value })
              }
              disabled={loading}
              placeholder="Cuéntanos brevemente sobre ti y tu experiencia"
            />
          </div>

          <Button 
            onClick={updateProfile} 
            disabled={saving || loading}
            className="w-full sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
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