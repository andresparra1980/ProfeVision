"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    biografia: "",
  });

  const fetchProfile = useCallback(async () => {
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
        title: t('errors.title'),
        description: t('errors.fetchProfile'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error(t('errors.noSession'));
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
        title: t('messages.profileUpdated'),
        description: t('messages.changesSaved'),
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Error updating profile:", err);
      toast({
        title: t('errors.title'),
        description: t('errors.saveChanges'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
          <CardDescription>
            {t('profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">{t('profile.form.firstName')}</Label>
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
              <Label htmlFor="apellidos">{t('profile.form.lastName')}</Label>
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
            <Label htmlFor="email">{t('profile.form.email')}</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              {t('profile.form.emailNotChangeable')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('profile.form.phone')}</Label>
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
            <Label htmlFor="biografia">{t('profile.form.biography')}</Label>
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
            {saving ? t('profile.form.saving') : t('profile.form.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('password.title')}</CardTitle>
          <CardDescription>
            {t('password.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">{t('password.button')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.title')}</CardTitle>
          <CardDescription>
            {t('notifications.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('notifications.comingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 