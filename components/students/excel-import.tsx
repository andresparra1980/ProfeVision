"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('components.excelImport');
  const [_file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, _setErrors] = useState<string[]>([]);
  
  const _validateData = (data: Record<string, string>[]): { valid: Student[], errors: string[] } => {
    const validStudents: Student[] = [];
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push(t('validation.emptyFile'));
      return { valid: [], errors };
    }
    
    // Validar que el archivo tenga las columnas correctas
    const requiredColumns = ["Nombres", "Apellidos", "Identificación"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      errors.push(`${t('validation.missingColumns')}: ${missingColumns.join(", ")}`);
      return { valid: [], errors };
    }
    
    data.forEach((row, index) => {
      // Asegurarse que todos los valores sean strings y limpiar espacios extra
      const nombres = (row.Nombres ? String(row.Nombres) : '').trim().replace(/\s+/g, ' ');
      const apellidos = (row.Apellidos ? String(row.Apellidos) : '').trim().replace(/\s+/g, ' ');
      const identificacion = (row.Identificación ? String(row.Identificación) : '').trim().replace(/\s+/g, '');
      const email = (row.Email ? String(row.Email) : '').trim().toLowerCase();
      
      if (!nombres) {
        errors.push(`${t('validation.row')} ${index + 1}: ${t('validation.missingNames')}`);
        return;
      }

      if (!apellidos) {
        errors.push(`${t('validation.row')} ${index + 1}: ${t('validation.missingSurnames')}`);
        return;
      }
      
      if (!identificacion) {
        errors.push(`${t('validation.row')} ${index + 1}: ${t('validation.missingIdentification')}`);
        return;
      }
      
      // Email es opcional pero debe ser válido si existe
      if (email && !validateEmail(email)) {
        errors.push(`${t('validation.row')} ${index + 1}: ${t('validation.invalidEmail')}`);
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
        title: t('error.title'),
        description: t('error.readingFile'),
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
          if (!data) throw new Error(t('error.readingFile'));
          
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
  // Loggear el auth.uid antes de importar
  const { data: { user } } = await supabase.auth.getUser();
  logger.log(`[IMPORT] Usuario autenticado: ${user?.id}`);
  logger.log(`[IMPORT] GroupId: ${groupId}`);
    if (preview.length === 0) {
      toast({
        title: t('error.title'),
        description: t('error.noDataToImport'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let shouldNotifyParent = false;

    try {
      if (groupId) {
        // Evitar duplicados por profesor: buscar solo los estudiantes accesibles (por RLS) con la misma identificación
        const estudianteIds: string[] = [];
        const identificaciones = preview.map(s => s.identificacion);

        // Buscar estudiantes accesibles al profesor por identificacion
        const { data: myStudents, error: myStudentsError } = await supabase
          .from("estudiantes")
          .select("id, identificacion")
          .in("identificacion", identificaciones);
        if (myStudentsError) throw myStudentsError;

        // Crear un mapa para acceso rápido
        const myStudentsMap = new Map<string, string>();
        if (myStudents && myStudents.length > 0) {
          myStudents.forEach((student: { identificacion: string; id: string }) => {
            myStudentsMap.set(student.identificacion, student.id);
          });
        }

        // Para cada estudiante del preview, usar el existente si lo hay, si no crear uno nuevo
        const studentsToInsert: Student[] = [];
        preview.forEach((student: Student) => {
          if (myStudentsMap.has(student.identificacion)) {
            estudianteIds.push(myStudentsMap.get(student.identificacion)!);
          } else {
            studentsToInsert.push(student);
          }
        });

        // Insertar solo los que no existen para el profesor usando RPC
        logger.log(`[IMPORT] Estudiantes a insertar: ${studentsToInsert.length}`, studentsToInsert);
        if (studentsToInsert.length > 0) {
          logger.log(`[IMPORT] Usando RPC crear_estudiante_en_grupo para ${studentsToInsert.length} estudiantes`);
          
          let successCount = 0;
          for (const student of studentsToInsert) {
            try {
              const { data, error } = await supabase.rpc('crear_estudiante_en_grupo', {
                p_nombres: student.nombres,
                p_apellidos: student.apellidos,
                p_identificacion: student.identificacion,
                p_email: student.email || '',
                p_grupo_id: groupId
              });
              
              if (error) {
                logger.error(`[IMPORT] Error al crear estudiante ${student.nombres}:`, error);
                throw error;
              }
              
              if (data) {
                estudianteIds.push(data); // data es el ID del estudiante
                successCount++;
              }
            } catch (err) {
              logger.error(`[IMPORT] Error al crear estudiante ${student.nombres}:`, err);
              // Continuar con el siguiente estudiante si uno falla
            }
          }
          
          logger.log(`[IMPORT] Estudiantes insertados exitosamente: ${successCount}`);
        }

        // Verificar que tenemos IDs para relacionar
        logger.log(`[IMPORT] Total estudianteIds: ${estudianteIds.length}`, estudianteIds);
        
        // Relacionar todos los IDs al grupo (sin duplicados)
        const estudiante_grupo_data = estudianteIds.map((studentId) => ({
          estudiante_id: studentId,
          grupo_id: groupId,
        }));
        const { error: relationError } = await supabase
          .from("estudiante_grupo")
          .upsert(estudiante_grupo_data, {
            onConflict: "estudiante_id,grupo_id",
            ignoreDuplicates: true,
          });
        if (relationError && relationError.code !== "23505") {
          throw relationError;
        }

        toast({
          title: "Éxito",
          description: `Se importaron y asignaron ${estudianteIds.length} estudiantes al grupo`,
          variant: "default",
        });
        shouldNotifyParent = true;
      } else {
        // Si no hay grupo, simplemente insertar todos
        const { data, error } = await supabase
          .from("estudiantes")
          .insert(preview)
          .select();
        logger.log("Resultado de importación:", { data, error, preview_length: preview.length });
        if (error) {
          toast({
            title: "Error",
            description: error.message || "No se pudieron importar los estudiantes",
            variant: "destructive",
          });
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
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: Error | unknown) {
      logger.error("Error importing students:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron importar los estudiantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          {t('downloadTemplate')}
        </Button>
        <div className="text-sm text-muted-foreground">
          {t('downloadDescription')}
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-muted/30">
        <div className="mb-4">
          <label 
            htmlFor="file-input" 
            className="block mb-2 text-sm font-medium"
          >
            {t('selectFile')}
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
                <p className="font-medium">{t('errorsFound')}</p>
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
            <h3 className="text-sm font-medium mb-2">{t('preview.title', { count: preview.length })}</h3>
            <div className="overflow-auto max-h-36 rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('preview.table.names')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('preview.table.surnames')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('preview.table.identification')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('preview.table.email')}</th>
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
                        {t('preview.table.andMore', { count: preview.length - 5 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2 items-center">
                <Badge variant="secondary">
                  {t('preview.validStudents', { count: preview.length })}
                </Badge>
                {errors.length > 0 && (
                  <Badge variant="destructive">
                    {t('preview.errors', { count: errors.length })}
                  </Badge>
                )}
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || preview.length === 0}
              >
                {isLoading ? t('importing') : t('importStudents')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 