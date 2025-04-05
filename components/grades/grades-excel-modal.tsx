'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Download, FileUp, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ComponenteCalificacion, Estudiante, Materia, Grupo, Periodo } from '@/lib/types/database';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';

interface GradesExcelModalProps {
  estudiantes: Estudiante[];
  componente: ComponenteCalificacion | null;
  calificaciones: Record<string, number> | Record<string, Record<string, number>>;
  onImportComplete: () => void;
  mode: 'import' | 'export' | 'export-period' | 'export-final';
  materia: any;
  grupo: any;
  periodoActual?: string;
  componentesPeriodo?: ComponenteCalificacion[];
  todosComponentes?: ComponenteCalificacion[];
  todasCalificaciones?: Record<string, Record<string, number>>;
  periodos: Periodo[];
  componentes: ComponenteCalificacion[];
  institucionName?: string;
}

export function GradesExcelModal({ 
  estudiantes, 
  componente, 
  calificaciones, 
  onImportComplete,
  mode,
  materia,
  grupo,
  periodoActual,
  componentesPeriodo,
  todosComponentes,
  todasCalificaciones,
  periodos,
  componentes,
  institucionName = 'INSTITUCIÓN EDUCATIVA',
}: GradesExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{identificacion: string, nombre_completo: string, valor: number}[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  if ((mode === 'import' || mode === 'export') && !componente) {
    return <div>No se ha seleccionado un componente de calificación</div>;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setErrors([]);
    setPreview([]);
    
    try {
      // Validar extensión del archivo
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        });
        return;
      }
      
      // Leer el archivo
      const data = await readExcelFile(selectedFile);
      
      if (!data || data.length === 0) {
        toast({
          title: "Archivo vacío",
          description: "El archivo no contiene datos para importar",
          variant: "destructive",
        });
        return;
      }
      
      // Validar los datos
      const { valid, errors } = validateData(data);
      setPreview(valid);
      setErrors(errors);
      
      if (valid.length === 0) {
        toast({
          title: "Datos inválidos",
          description: "No se encontraron registros válidos para importar",
          variant: "destructive",
        });
      } else if (valid.length > 0 && errors.length > 0) {
        toast({
          title: "Advertencia",
          description: `Se encontraron ${valid.length} registros válidos y ${errors.length} con errores`,
          variant: "destructive",
        });
      } else if (valid.length > 0) {
        toast({
          title: "Archivo válido",
          description: `Se encontraron ${valid.length} calificaciones para importar`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error reading Excel file:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un archivo Excel válido y no esté dañado.",
        variant: "destructive",
      });
    }
  };
  
  const readExcelFile = (file: File): Promise<any[]> => {
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
          
          resolve(json);
        } catch (error) {
          console.error("Error al procesar archivo Excel:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };
  
  const validateData = (data: any[]): { valid: {identificacion: string, nombre_completo: string, valor: number}[], errors: string[] } => {
    const validGrades: {identificacion: string, nombre_completo: string, valor: number}[] = [];
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("El archivo no contiene datos");
      return { valid: [], errors };
    }
    
    // Validar que el archivo tenga las columnas correctas
    const requiredColumns = ["Identificación", "Nombre", "Calificación"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas requeridas: ${missingColumns.join(", ")}`);
      return { valid: [], errors };
    }
    
    // Mapear estudiantes para validación rápida
    const estudiantesMap = new Map(estudiantes.map(e => [e.identificacion, e]));
    
    // Validar cada fila
    data.forEach((row, index) => {
      // Verificar que existan las columnas requeridas
      if (!row['Identificación'] || !row['Nombre'] || row['Calificación'] === undefined) {
        errors.push(`Fila ${index + 1}: Faltan columnas requeridas`);
        return;
      }
      
      // Verificar que el estudiante exista
      const estudiante = estudiantesMap.get(row['Identificación']);
      if (!estudiante) {
        errors.push(`Fila ${index + 1}: Estudiante con identificación ${row['Identificación']} no encontrado`);
        return;
      }
      
      // Verificar que la calificación sea un número válido
      const valor = parseFloat(row['Calificación']);
      if (isNaN(valor) || valor < 0 || valor > 5) {
        errors.push(`Fila ${index + 1}: La calificación debe ser un número entre 0 y 5`);
        return;
      }
      
      // Verificar que el nombre coincida con la identificación
      if (estudiante.nombre_completo !== row['Nombre']) {
        errors.push(`Fila ${index + 1}: El nombre '${row['Nombre']}' no coincide con la identificación ${row['Identificación']}`);
        return;
      }
      
      // Si pasó todas las validaciones, agregar a los válidos
      validGrades.push({
        identificacion: row['Identificación'],
        nombre_completo: row['Nombre'],
        valor
      });
    });
    
    return { valid: validGrades, errors };
  };
  
  const handleSubmit = async () => {
    if (preview.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos válidos para importar",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Crear un mapa de estudiantes por identificación
      const estudiantesMap = new Map(estudiantes.map(e => [e.identificacion, e]));
      
      // Obtener los IDs de estudiantes que tienen calificaciones para este componente
      const { data: existingGrades } = await supabase
        .from('calificaciones')
        .select('estudiante_id')
        .eq('componente_id', componente.id);

      const existingStudentIds = new Set(existingGrades?.map(g => g.estudiante_id) || []);
      
      // Preparar arrays para upsert
      const calificacionesArray = preview.map(item => {
        const estudiante = estudiantesMap.get(item.identificacion);
        if (!estudiante) throw new Error(`Estudiante no encontrado: ${item.identificacion}`);
        
        return {
          id: crypto.randomUUID(),
          estudiante_id: estudiante.id,
          componente_id: componente.id,
          valor: item.valor
        };
      });

      // Realizar upsert
      const { error } = await supabase
        .from('calificaciones')
        .upsert(calificacionesArray, {
          onConflict: 'estudiante_id,componente_id'
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Calificaciones importadas correctamente",
      });

      onImportComplete();
    } catch (error) {
      console.error('Error al importar calificaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron importar las calificaciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = () => {
    if (!componente || typeof calificaciones !== 'object') return;

    // Asegurarnos de que estamos trabajando con calificaciones de un solo componente
    const componentGrades = 'porComponente' in calificaciones 
      ? (calificaciones.porComponente[componente.id] || {}) as Record<string, number>
      : calificaciones as Record<string, number>;

    // Crear array de datos para exportar
    const dataToExport = estudiantes.map(estudiante => ({
      "Identificación": estudiante.identificacion,
      "Nombre": estudiante.nombre_completo,
      "Calificación": componentGrades[estudiante.id] !== undefined ? componentGrades[estudiante.id] : ''
    }));
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear una hoja con los datos
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    
    // Generar el archivo y descargarlo
    if (componente) {
      XLSX.writeFile(wb, `calificaciones_${componente.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    }
  };

  const downloadTemplate = () => {
    if (!componente) return;

    // Crear array de datos para la plantilla
    const dataToExport = estudiantes.map(estudiante => ({
      "Identificación": estudiante.identificacion,
      "Nombre": estudiante.nombre_completo,
      "Calificación": ''
    }));
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear una hoja con los datos de plantilla
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, `plantilla_calificaciones_${componente.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const handleExportPeriod = () => {
    if (!materia || !grupo || !periodoActual || !componentesPeriodo || !todasCalificaciones) {
      toast({
        title: "Error",
        description: "Faltan datos necesarios para la exportación del periodo",
        variant: "destructive",
      });
      return;
    }

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Preparar los datos del encabezado
    const headerData = [
      [institucionName],
      ['REGISTRO DE CALIFICACIONES'],
      [''],
      [`Materia: ${materia.nombre}`],
      [`Grupo: ${grupo.nombre}`],
      [`Periodo: ${periodoActual}`],
      [''],
      [''] // Línea en blanco antes de los datos
    ];

    // Preparar encabezados de columnas
    const columns = [
      'Identificación',
      'Estudiante',
      ...componentesPeriodo.map(comp => `${comp.nombre} (${comp.porcentaje}%)`),
      'Nota Final del Periodo'
    ];

    // Preparar datos de estudiantes
    const studentsData = estudiantes.map(estudiante => {
      // Obtener calificaciones del estudiante para cada componente
      const notasComponentes = componentesPeriodo.map(comp => {
        return todasCalificaciones[estudiante.id]?.[comp.id] || 0;
      });

      // Calcular nota final del periodo
      const notaFinal = componentesPeriodo.reduce((acc, comp, index) => {
        const nota = notasComponentes[index];
        return acc + (nota * (comp.porcentaje / 100));
      }, 0);

      return [
        estudiante.identificacion,
        estudiante.nombre_completo,
        ...notasComponentes.map(nota => nota || ''),
        notaFinal.toFixed(2)
      ];
    });

    // Combinar todo en una matriz
    const allData = [...headerData, columns, ...studentsData];

    // Crear hoja y añadirla al libro
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar estilos (merge cells para títulos, etc)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Periodo ${periodoActual}`);
    XLSX.writeFile(wb, `calificaciones_periodo_${periodoActual}_${materia.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

    toast({
      title: "Éxito",
      description: "Calificaciones del periodo exportadas correctamente",
    });
  };

  const handleExportFinal = () => {
    if (!materia || !grupo || !todosComponentes || !todasCalificaciones || !periodos || !componentes) {
      toast({
        title: "Error",
        description: "Faltan datos necesarios para la exportación final",
        variant: "destructive",
      });
      return;
    }

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Preparar los datos del encabezado
    const headerData = [
      [institucionName],
      ['REGISTRO DE CALIFICACIONES FINALES'],
      [''],
      [`Materia: ${materia.nombre}`],
      [`Grupo: ${grupo.nombre}`],
      [`Año Lectivo: ${new Date().getFullYear()}`],
      [''],
      [''] // Línea en blanco antes de los datos
    ];

    // Preparar encabezados de columnas
    const columns = [
      'Identificación',
      'Estudiante',
      ...periodos.map(p => `${p.nombre} (${p.porcentaje}%)`),
      'Nota Final'
    ];

    // Preparar datos de estudiantes
    const studentsData = estudiantes.map(estudiante => {
      // Obtener notas de los periodos
      const notasPeriodos = periodos.map(periodo => {
        const componentesPeriodo = componentes.filter((c: ComponenteCalificacion) => c.periodo_id === periodo.id);
        let notaPeriodo = 0;
        let porcentajeTotal = 0;

        componentesPeriodo.forEach((componente: ComponenteCalificacion) => {
          const calificacionesEstudiante = todasCalificaciones[estudiante.id] as Record<string, number>;
          const nota = calificacionesEstudiante?.[componente.id] || 0;
          notaPeriodo += nota * (componente.porcentaje / 100);
          porcentajeTotal += componente.porcentaje;
        });

        return porcentajeTotal > 0 ? notaPeriodo : 0;
      });

      // Calcular nota final
      const notaFinal = todosComponentes.reduce((acc, comp) => {
        const nota = todasCalificaciones[estudiante.id]?.[comp.id] || 0;
        return acc + (nota * (comp.porcentaje / 100));
      }, 0);

      return [
        estudiante.identificacion,
        estudiante.nombre_completo,
        ...notasPeriodos.map(nota => nota.toFixed(2)),
        notaFinal.toFixed(2)
      ];
    });

    // Combinar todo en una matriz
    const allData = [...headerData, columns, ...studentsData];

    // Crear hoja y añadirla al libro
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Aplicar estilos (merge cells para títulos, etc)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }
    ];

    // Aplicar estilos de celda para las notas de periodo y final
    const headerRow = headerData.length;
    for (let row = headerRow + 1; row < headerRow + 1 + studentsData.length; row++) {
      // Para cada periodo (empezando después de Identificación y Estudiante)
      for (let col = 2; col < 2 + periodos.length; col++) {
        ws[XLSX.utils.encode_cell({ r: row, c: col })] = {
          ...ws[XLSX.utils.encode_cell({ r: row, c: col })],
          s: { fill: { fgColor: { rgb: "F4F4F5" } } } // bg-muted/50
        };
      }
      // Para la nota final (última columna)
      const finalCol = columns.length - 1;
      ws[XLSX.utils.encode_cell({ r: row, c: finalCol })] = {
        ...ws[XLSX.utils.encode_cell({ r: row, c: finalCol })],
        s: { fill: { fgColor: { rgb: "E4E4E7" } } } // bg-muted
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Notas Finales');
    XLSX.writeFile(wb, `calificaciones_finales_${materia.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

    toast({
      title: "Éxito",
      description: "Calificaciones finales exportadas correctamente",
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        {mode === 'import' ? 'Importar calificaciones' : 'Exportar calificaciones'}
        {mode === 'import' || mode === 'export' ? ` - ${componente?.nombre}` : ''}
      </h3>
      
      {mode === 'import' ? (
        <>
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar plantilla
            </Button>
            <div className="text-sm text-muted-foreground">
              Descarga la plantilla con los estudiantes actuales y sus calificaciones
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-muted/30">
            <div className="mb-4">
              <Label 
                htmlFor="file-input" 
                className="block mb-2 text-sm font-medium"
              >
                Seleccionar archivo Excel
              </Label>
              <Input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full"
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
                <h3 className="text-sm font-medium mb-2">Vista previa ({preview.length} calificaciones)</h3>
                <div className="overflow-auto max-h-36 rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-xs">{item.identificacion}</td>
                          <td className="px-4 py-2 text-xs">{item.nombre_completo}</td>
                          <td className="px-4 py-2 text-xs">{item.valor}</td>
                        </tr>
                      ))}
                      {preview.length > 5 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-xs text-center">
                            Y {preview.length - 5} más...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || preview.length === 0}
                className="ml-2"
              >
                {isLoading ? 'Importando...' : 'Importar calificaciones'}
              </Button>
            </div>
          </div>
        </>
      ) : mode === 'export-period' ? (
        <div className="flex justify-center py-6">
          <Button
            onClick={handleExportPeriod}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Periodo Actual
          </Button>
        </div>
      ) : mode === 'export-final' ? (
        <div className="flex justify-center py-6">
          <Button
            onClick={handleExportFinal}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Notas Finales
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Button
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar calificaciones
          </Button>
        </div>
      )}
    </div>
  );
} 