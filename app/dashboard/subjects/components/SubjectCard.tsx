import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, School } from "lucide-react";
import type { Database } from "@/lib/types/database";

type Materia = Database["public"]["Tables"]["materias"]["Row"] & {
  entidades_educativas?: {
    id: string;
    nombre: string;
  };
};

interface SubjectCardProps {
  materia: Materia;
  onEdit: (_: Materia) => void;
  onDelete: (_: Materia) => void;
}

export function SubjectCard({ materia, onEdit, onDelete }: SubjectCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-xl">{materia.nombre}</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(materia)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(materia)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {materia.entidades_educativas && (
          <div className="flex items-center text-sm text-muted-foreground">
            <School className="mr-1 h-3 w-3" />
            <span>{materia.entidades_educativas.nombre}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {materia.descripcion && (
          <p className="text-sm text-muted-foreground">{materia.descripcion}</p>
        )}
      </CardContent>
    </Card>
  );
}