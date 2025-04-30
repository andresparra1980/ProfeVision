"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
      handleSupabaseError("al cargar instituciones educativas", error);
    } finally {
      setLoading(false);
    }
  }, [router, handleSupabaseError]);

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
        throw new Error('Debes iniciar sesión para crear una entidad educativa');
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
        const apiError = new Error(result.error || 'Error al crear la entidad educativa');
        (apiError as ApiError).status = response.status;
        (apiError as ApiError).details = result.details;
        throw apiError;
      }

      toast({
        title: '¡Éxito!',
        description: 'Entidad educativa creada correctamente',
        variant: 'default',
      });

      setFormData({
        nombre: '',
        tipo: '',
      });

      setIsOpen(false);

      fetchEntities();
    } catch (error) {
      handleSupabaseError("al crear la entidad educativa", error);
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
          <h2 className="text-3xl font-bold tracking-tight">Instituciones Educativas</h2>
          <p className="text-muted-foreground">
            {entities.length === 0 
              ? "Debes crear al menos una institución educativa antes de poder crear materias" 
              : "Gestiona tus instituciones educativas"}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva Institución
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#FAFAF4] dark:bg-[#171717]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Añadir Institución Educativa</DialogTitle>
                <DialogDescription>
                  Ingresa el nombre y tipo de la institución donde impartes clases
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Institución *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Universidad Nacional, Colegio San José"
                    className="bg-white dark:bg-[#1E1E1F]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Institución</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger id="tipo" className="bg-white dark:bg-[#1E1E1F]">
                      <SelectValue placeholder="Selecciona un tipo de institución" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Universidad">Universidad</SelectItem>
                      <SelectItem value="Instituto">Instituto</SelectItem>
                      <SelectItem value="Colegio">Colegio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Añadir Institución"}
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
              Aún no tienes instituciones educativas registradas. Debes añadir al menos una para poder crear materias y exámenes.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Añadir Primera Institución
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tus Instituciones Educativas</CardTitle>
            <CardDescription>
              Instituciones donde impartes clases
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder="Buscar institución..."
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
                <p className="text-muted-foreground">No se encontraron instituciones educativas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.nombre}</TableCell>
                        <TableCell>{entity.tipo || "No especificado"}</TableCell>
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