"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/lib/utils/logger";

interface EducationalEntity {
  id: string;
  nombre: string;
  tipo: string | null;
}

interface ProfesorEntidadRelation {
  entidad_id: string;
  entidades_educativas: EducationalEntity;
}

// Define a type for API errors
interface ApiError extends Error {
  status?: number;
  details?: string;
}

export default function EntitiesPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.entities');
  const [entities, setEntities] = useState<EducationalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    toast({ 
      variant: "destructive", 
      title: `Error en ${context}`, 
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

  const filteredEntities = entities.filter((entity) =>
    entity.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entity.tipo && entity.tipo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(t('toast.loginRequired'));
      }

      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const apiError = new Error(result.error || t('toast.creationError'));
        (apiError as ApiError).status = response.status;
        (apiError as ApiError).details = result.details;
        throw apiError;
      }

      toast({
        title: t('toast.successTitle'),
        description: t('toast.successDescription'),
        variant: 'default',
      });

      setFormData({
        nombre: '',
        tipo: '',
      });

      setIsOpen(false);

      fetchEntities();
    } catch (error) {
      handleSupabaseError(t('toast.errorCreating'), error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {entities.length === 0 
              ? t('emptyDescription')
              : t('description')}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('newEntity')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#FAFAF4] dark:bg-[#171717]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t('form.addTitle')}</DialogTitle>
                <DialogDescription>
                  {t('form.addDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">{t('form.nameLabel')}</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder={t('form.namePlaceholder')}
                    className="bg-white dark:bg-[#1E1E1F]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">{t('form.typeLabel')}</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger id="tipo" className="bg-white dark:bg-[#1E1E1F]">
                      <SelectValue placeholder={t('form.typePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Universidad">{t('form.typeUniversity')}</SelectItem>
                      <SelectItem value="Instituto">{t('form.typeInstitute')}</SelectItem>
                      <SelectItem value="Colegio">{t('form.typeSchool')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  {t('form.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('form.creating') : t('form.addButton')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {entities.length === 0 && !loading ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              {t('noEntitiesMessage')}
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('addFirstEntity')}
            </Button>
          </CardContent>
        </Card>
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
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t('noResultsMessage')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.name')}</TableHead>
                      <TableHead>{t('table.type')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.nombre}</TableCell>
                        <TableCell>{entity.tipo || t('table.notSpecified')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 