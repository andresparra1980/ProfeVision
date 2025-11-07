"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import { TitleCardWithDepth } from "@/components/shared/title-card-with-depth";
import {
  EntityFormModal,
  EntitiesTable,
  EmptyEntitiesState,
  EntitiesPageSkeleton
} from "./components";

interface EducationalEntity {
  id: string;
  nombre: string;
  tipo: string | null;
}

interface ProfesorEntidadRelation {
  entidad_id: string;
  entidades_educativas: EducationalEntity;
}

export default function EntitiesPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.entities');
  const [entities, setEntities] = useState<EducationalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

    logger.error(`[EntitiesPage] ${context}:`, { 
      message: errorObj.message, 
      status: status,
      code: code,
      details: details,
      errorObject: errorObj 
    });
    
    const toastMessage = `Error: ${errorObj?.message || 'Desconocido'}${status ? ` (${status})` : ''}${code ? ` [${code}]` : ''}`;
    toast.error(`Error en ${context}`, { 
      description: toastMessage
    });
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profesor_entidad")
        .select("entidad_id, entidades_educativas(*)")
        .eq("profesor_id", session.user.id);

      if (fetchError) {
        throw fetchError;
      }
      
      const entitiesList = data.map((item: ProfesorEntidadRelation) => item.entidades_educativas);
      setEntities(entitiesList || []);
    } catch (error) {
      handleSupabaseError(t('toast.errorLoading'), error);
    } finally {
      setLoading(false);
    }
  }, [router, handleSupabaseError, t]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Show loading skeleton
  if (loading) {
    return <EntitiesPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <TitleCardWithDepth
        title={t('title')}
        description={entities.length === 0 ? t('emptyDescription') : t('description')}
        actions={
          <Button className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('newEntity')}
          </Button>
        }
      />

      <EntityFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchEntities}
      />

      {entities.length === 0 && !loading ? (
        <EmptyEntitiesState onCreateEntity={() => setIsFormOpen(true)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('yourEntities')}</CardTitle>
            <CardDescription>
              {t('entitiesDescription')}
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <EntitiesTable entities={entities} searchQuery={searchQuery} />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 