"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProfileForm, PasswordSection, NotificationsSection, SettingsPageSkeleton } from "./components";

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const [loading, setLoading] = useState(false);
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
      toast.error(t('errors.title'), {
        description: t('errors.fetchProfile'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <ProfileForm
        profileData={profileData}
        loading={loading}
        onUpdate={fetchProfile}
      />

      <PasswordSection />

      <NotificationsSection />
    </div>
  );
} 