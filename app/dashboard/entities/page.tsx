"use client";

import { useState, useEffect } from "react";
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

export default function EntitiesPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  async function fetchEntities() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/auth/login");
        return;
      }

      // Corregir la consulta para usar entidad_id en lugar de entidad_educativa_id
      const { data, error } = await supabase
        .from("profesor_entidad")
        .select("entidad_id, entidades_educativas(*)")
        .eq("profesor_id", session.user.id);

      if (error) {
        console.error("Error al consultar entidades:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las instituciones educativas",
          variant: "destructive",
        });
        return;
      }
      
      // Transformar el resultado para tener un array de entidades
      const entitiesList = data.map((item: any) => item.entidades_educativas);
      setEntities(entitiesList || []);
    } catch (error) {
      console.error("Error inesperado:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar las instituciones educativas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredEntities = entities.filter((entity) =>
    entity.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entity.tipo && entity.tipo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Verificar usuario autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError('Debes iniciar sesión para crear una entidad educativa');
        setIsSubmitting(false);
        return;
      }

      // Enviar datos al endpoint de API
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profesorId: session.user.id,
          userEmail: session.user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la entidad educativa');
      }

      // Si todo salió bien
      toast({
        title: '¡Éxito!',
        description: 'Entidad educativa creada correctamente',
        variant: 'default',
      });

      // Reiniciar formulario
      setFormData({
        nombre: '',
        tipo: '',
      });

      // Cerrar diálogo
      setIsOpen(false);

      // Recargar datos
      fetchEntities();
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear la entidad educativa');
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la entidad educativa',
        variant: 'destructive',
      });
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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