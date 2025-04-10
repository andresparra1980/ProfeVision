"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import logger from "@/lib/utils/logger";

interface Student {
  id?: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
}

interface ExcelImportProps {
  onImportComplete: () => void;
  groupId?: string;
}

export function ExcelImport({ onImportComplete, groupId }: ExcelImportProps) {
  const [_file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, _setErrors] = useState<string[]>([]);
  
  const _validateData = (data: Record<string, string>[]): { valid: Student[], errors: string[] } => {
    const validStudents: Student[] = [];
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("El archivo no contiene datos");
      return { valid: [], errors };
    }
    
    // Validar que el archivo tenga las columnas correctas
    const requiredColumns = ["Nombres", "Apellidos", "Identificación"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas requeridas: ${missingColumns.join(", ")}`);
      return { valid: [], errors };
    }
    
    data.forEach((row, index) => {
      // Asegurarse que todos los valores sean strings y limpiar espacios extra
      const nombres = (row.Nombres ? String(row.Nombres) : '').trim().replace(/\s+/g, ' ');
      const apellidos = (row.Apellidos ? String(row.Apellidos) : '').trim().replace(/\s+/g, ' ');
      const identificacion = (row.Identificación ? String(row.Identificación) : '').trim().replace(/\s+/g, '');
      const email = (row.Email ? String(row.Email) : '').trim().toLowerCase();
      
      if (!nombres) {
        errors.push(`Fila ${index + 1}: Faltan los nombres`);
        return;
      }

      if (!apellidos) {
        errors.push(`Fila ${index + 1}: Faltan los apellidos`);
        return;
      }
      
      if (!identificacion) {
        errors.push(`Fila ${index + 1}: Falta la identificación`);
        return;
      }
      
      // Email es opcional pero debe ser válido si existe
      if (email && !validateEmail(email)) {
        errors.push(`Fila ${index + 1}: El correo electrónico no es válido`);
        return;
      }
      
      validStudents.push({
        nombres: nombres.charAt(0).toUpperCase() + nombres.slice(1), // Primera letra mayúscula
        apellidos: apellidos.charAt(0).toUpperCase() + apellidos.slice(1), // Primera letra mayúscula
        identificacion,
        email: email || ''
      });
    });
    
    return { valid: validStudents, errors };
  };
  
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const data = await readExcelFile(file);
      
      // Mapear los datos a nuestro formato
      const mappedData = data.map((row: Record<string, string>) => ({
        nombres: row.nombres || row.Nombres || '',
        apellidos: row.apellidos || row.Apellidos || '',
        identificacion: row.identificacion || row.Identificación || row.ID || '',
        email: row.email || row.Email || row.Correo || '',
      }));

      setPreview(mappedData);
      setFile(file);
    } catch (error) {
      logger.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "No se pudo leer el archivo. Asegúrate de que sea un archivo Excel válido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const readExcelFile = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("No se pudo leer el archivo");
          
          // Leer el archivo y convertir los datos
          const workbook = XLSX.read(data, { type: "binary", cellDates: true, cellText: false });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Usar opciones para asegurar que todos los valores sean strings
          const json = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Convertir todo a strings
            defval: "", // Valor predeterminado para celdas vacías
          });
          
          resolve(json as Record<string, string>[]);
        } catch (error) {
          logger.error("Error al procesar archivo Excel:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };
  
  const handleImport = async () => {
    if (preview.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos válidos para importar",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    let shouldNotifyParent = false;
    
    try {
      // Si estamos importando dentro de un grupo, usamos una estrategia diferente
      if (groupId) {
        // Preparamos un array para guardar los IDs de estudiantes (nuevos y existentes)
        const estudianteIds: string[] = [];
        
        // Primero, buscamos estudiantes que ya existan por identificación
        const identificaciones = preview.map(s => s.identificacion);
        const { data: existingStudents, error: existingError } = await supabase
          .from("estudiantes")
          .select("id, identificacion")
          .in("identificacion", identificaciones);
        
        if (existingError) throw existingError;
        
        // Mapeamos los IDs y creamos un mapa para buscar rápidamente
        const existingMap = new Map();
        if (existingStudents && existingStudents.length > 0) {
          existingStudents.forEach((student: { identificacion: string, id: string }) => {
            existingMap.set(student.identificacion, student.id);
            estudianteIds.push(student.id);
          });
        }
        
        // Filtramos los estudiantes que no existen aún
        const newStudents = preview.filter((student: Student) => !existingMap.has(student.identificacion));
        
        // Si hay nuevos estudiantes, los insertamos
        if (newStudents.length > 0) {
          // Usamos una función RPC para insertar estudiantes (una alternativa segura)
          const { data: insertedStudents, error: insertError } = await supabase
            .rpc('insertar_estudiantes', {
              estudiantes: newStudents
            });
          
          if (insertError) {
            // Si no existe la función RPC, intentamos la inserción directa
            logger.warn("Error usando RPC, intentando inserción directa:", insertError);
            
            // Inserción directa como fallback
            const { data, error } = await supabase
              .from("estudiantes")
              .insert(newStudents)
              .select();
              
            if (error) throw error;
            
            if (data && data.length > 0) {
              data.forEach((student: { id: string }) => estudianteIds.push(student.id));
            }
          } else if (insertedStudents && insertedStudents.length > 0) {
            // Si usamos RPC, añadimos los IDs devueltos
            insertedStudents.forEach((id: string) => estudianteIds.push(id));
          } else {
            // Si no hay error pero tampoco datos, buscamos los estudiantes recién insertados
            const { data: freshStudents, error: freshError } = await supabase
              .from("estudiantes")
              .select("id, identificacion")
              .in("identificacion", newStudents.map(s => s.identificacion));
              
            if (freshError) throw freshError;
            
            if (freshStudents && freshStudents.length > 0) {
              freshStudents.forEach((student: { id: string }) => {
                if (!estudianteIds.includes(student.id)) {
                  estudianteIds.push(student.id);
                }
              });
            }
          }
        }
        
        // Si tenemos IDs de estudiantes, creamos las relaciones con el grupo
        if (estudianteIds.length > 0) {
          const estudiante_grupo_data = estudianteIds.map(studentId => ({
            estudiante_id: studentId,
            grupo_id: groupId
          }));
          
          const { error: relationError } = await supabase
            .from("estudiante_grupo")
            .upsert(estudiante_grupo_data, {
              onConflict: 'estudiante_id,grupo_id',
              ignoreDuplicates: true
            });
            
          if (relationError && relationError.code !== '23505') {
            throw relationError;
          }
          
          toast({
            title: "Éxito",
            description: `Se importaron y asignaron ${estudianteIds.length} estudiantes al grupo`,
            variant: "default",
          });
          shouldNotifyParent = true;
        } else {
          toast({
            title: "Información",
            description: "No se pudieron importar estudiantes nuevos",
            variant: "default",
          });
        }
      } else {
        // Estrategia original para cuando no hay grupo
        const { data, error } = await supabase
          .from("estudiantes")
          .insert(preview)
          .select();
        
        logger.log("Resultado de importación:", { data, error, preview_length: preview.length });
        
        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Advertencia",
              description: "Algunos estudiantes ya existen en el sistema (identificación duplicada)",
              variant: "destructive",
            });
            // Consideramos este caso como parcialmente exitoso
            shouldNotifyParent = true;
          } else {
            throw error;
          }
        } else {
          const successCount = data?.length || 0;
          toast({
            title: "Éxito",
            description: `Se importaron ${successCount} estudiantes correctamente`,
            variant: "default",
          });
          shouldNotifyParent = true;
        }
      }
      
      // Limpiar el formulario
      setFile(null);
      setPreview([]);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: Error | unknown) {
      logger.error("Error importing students:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron importar los estudiantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      
      // Siempre notificamos al componente padre
      if (shouldNotifyParent) {
        onImportComplete();
      }
    }
  };
  
  const downloadTemplate = () => {
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Datos de ejemplo
    const exampleData = [
      { 
        Nombres: "Juan Carlos",
        Apellidos: "Pérez González",
        Identificación: "12345678",
        Email: "estudiante1@ejemplo.com"
      },
      {
        Nombres: "María José",
        Apellidos: "López Ramírez",
        Identificación: "87654321",
        Email: "estudiante2@ejemplo.com"
      },
    ];
    
    // Crear una hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(exampleData);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, "formato_estudiantes.xlsx");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <Button 
          variant="outline" 
          onClick={downloadTemplate}
          className="flex items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar formato
        </Button>
        <div className="text-sm text-muted-foreground">
          Descarga el formato de ejemplo para importar estudiantes
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/30">
        <div className="mb-4">
          <label 
            htmlFor="file-input" 
            className="block mb-2 text-sm font-medium"
          >
            Seleccionar archivo Excel
          </label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-2"
          />
        </div>
        
        {errors.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-3 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Se encontraron los siguientes errores:</p>
                <ul className="ml-4 list-disc">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {preview.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Vista previa ({preview.length} estudiantes)</h3>
            <div className="overflow-auto max-h-36 rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombres</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellidos</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(0, 5).map((student, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-xs">{student.nombres}</td>
                      <td className="px-4 py-2 text-xs">{student.apellidos}</td>
                      <td className="px-4 py-2 text-xs">{student.identificacion}</td>
                      <td className="px-4 py-2 text-xs">{student.email || "-"}</td>
                    </tr>
                  ))}
                  {preview.length > 5 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-xs text-center">
                        Y {preview.length - 5} más...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2 items-center">
                <Badge variant="secondary">
                  {preview.length} estudiantes válidos
                </Badge>
                {errors.length > 0 && (
                  <Badge variant="destructive">
                    {errors.length} errores
                  </Badge>
                )}
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || preview.length === 0}
              >
                {isLoading ? "Importando..." : "Importar estudiantes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 