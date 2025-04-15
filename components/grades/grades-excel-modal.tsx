'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ComponenteCalificacion, Estudiante, Periodo } from '@/lib/types/database';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import logger from '@/lib/utils/logger';

// Extiende la interfaz ComponenteCalificacion para incluir la propiedad grupo_id
interface ComponenteCalificacionWithGrupo extends ComponenteCalificacion {
  grupo_id: string;
}

interface GradesExcelModalProps {
  estudiantes: Estudiante[];
  componente: ComponenteCalificacion | null;
  calificaciones: Record<string, number>;
  onImportComplete: (_calificaciones: Record<string, number>) => void;
  mode: 'import' | 'export' | 'export-period' | 'export-final';
  materia: { id: string; nombre: string };
  grupo: { 
    id: string; 
    nombre: string;
    periodo_escolar: string | null;
  };
  periodoActual: Periodo | null;
  componentesPeriodo: ComponenteCalificacion[] | null;
  todosComponentes: ComponenteCalificacion[] | null;
  todasCalificaciones: Record<string, Record<string, number>> | null;
  periodos: Periodo[] | null;
  componentes: ComponenteCalificacion[] | null;
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
  const [_file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{identificacion: string, nombres: string, apellidos: string, valor: number}[]>([]);
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
      logger.error("Error reading Excel file:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo. Asegúrate de que sea un archivo Excel válido y no esté dañado.",
        variant: "destructive",
      });
    }
  };
  
  // Define una interfaz para la estructura del archivo Excel
  interface ExcelRowData {
    Identificación: string;
    Nombres: string;
    Apellidos: string;
    Calificación: string;
    [key: string]: string | number; // Para otras columnas que puedan existir
  }
  
  const readExcelFile = (file: File): Promise<ExcelRowData[]> => {
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
          const json = XLSX.utils.sheet_to_json<ExcelRowData>(worksheet, {
            raw: false, // Convertir todo a strings
            defval: "", // Valor predeterminado para celdas vacías
          });
          
          resolve(json);
        } catch (error) {
          logger.error("Error al procesar archivo Excel:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };
  
  const validateData = (data: ExcelRowData[]): { valid: {identificacion: string, nombres: string, apellidos: string, valor: number}[], errors: string[] } => {
    const validGrades: {identificacion: string, nombres: string, apellidos: string, valor: number}[] = [];
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("El archivo no contiene datos");
      return { valid: [], errors };
    }
    
    // Validar que el archivo tenga las columnas correctas
    const requiredColumns = ["Identificación", "Nombres", "Apellidos", "Calificación"];
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
      if (!row['Identificación'] || !row['Nombres'] || !row['Apellidos'] || row['Calificación'] === undefined) {
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
      if (estudiante.nombres !== row['Nombres'] || estudiante.apellidos !== row['Apellidos']) {
        errors.push(`Fila ${index + 1}: Los nombres '${row['Nombres']} ${row['Apellidos']}' no coinciden con la identificación ${row['Identificación']}`);
        return;
      }
      
      // Si pasó todas las validaciones, agregar a los válidos
      validGrades.push({
        identificacion: row['Identificación'],
        nombres: row['Nombres'],
        apellidos: row['Apellidos'],
        valor
      });
    });
    
    return { valid: validGrades, errors };
  };
  
  const handleSubmit = async () => {
    if (!componente) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un componente de calificación",
        variant: "destructive",
      });
      return;
    }

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

      const _existingStudentIds = new Set(existingGrades?.map((g: { estudiante_id: string }) => g.estudiante_id) || []);
      
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

      onImportComplete(calificaciones);
    } catch (error) {
      logger.error('Error al importar calificaciones:', error);
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
      ? ((calificaciones as unknown as { porComponente: Record<string, Record<string, number>> }).porComponente[componente.id] || {})
      : calificaciones as Record<string, number>;

    // Crear array de datos para exportar
    const dataToExport = estudiantes.map(estudiante => ({
      "Identificación": estudiante.identificacion,
      "Nombres": estudiante.nombres,
      "Apellidos": estudiante.apellidos,
      "Calificación": componentGrades[estudiante.id] !== undefined ? componentGrades[estudiante.id] : ''
    }));
    
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Crear una hoja con los datos
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, `calificaciones_${componente.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const downloadTemplate = () => {
    if (!componente) return;

    // Crear array de datos para la plantilla
    const dataToExport = estudiantes.map(estudiante => ({
      "Identificación": estudiante.identificacion,
      "Nombres": estudiante.nombres,
      "Apellidos": estudiante.apellidos,
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
      logger.error('Datos faltantes:', {
        materia: !!materia,
        grupo: !!grupo,
        periodoActual,
        componentesPeriodo: !!componentesPeriodo,
        todasCalificaciones: !!todasCalificaciones
      });
      toast({
        title: "Error",
        description: "Faltan datos necesarios para la exportación del periodo",
        variant: "destructive",
      });
      return;
    }

    logger.log('Periodo actual:', periodoActual);
    logger.log('Porcentaje del periodo:', periodoActual.porcentaje);

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Preparar los datos del encabezado
    const headerData = [
      [institucionName],
      ['REGISTRO DE CALIFICACIONES'],
      [''],
      [`Materia: ${materia.nombre}`],
      [`Grupo: ${grupo.nombre}`],
      [`Periodo: ${periodoActual?.nombre || 'No definido'}`],
      [''],
      [''] // Línea en blanco antes de los datos
    ];

    // Preparar encabezados de columnas
    const columns = [
      'Identificación',
      'Apellidos',
      'Nombres',
      ...componentesPeriodo.map(comp => `${comp.nombre} (${comp.porcentaje}%)`),
      'Nota Periodo (Pond.)',
      'Nota Periodo (Abs.)'
    ];

    // Preparar datos de estudiantes
    const studentsData = estudiantes.map(estudiante => {
      // Obtener calificaciones del estudiante para cada componente
      const notasComponentes = componentesPeriodo.map(comp => {
        return todasCalificaciones[estudiante.id]?.[comp.id] || 0;
      });

      // Calcular notas del periodo
      let notaPonderada = 0;
      let _porcentajeTotal = 0;
      componentesPeriodo.forEach((comp, index) => {
        const nota = notasComponentes[index];
        notaPonderada += nota * (comp.porcentaje / 100);
        _porcentajeTotal += comp.porcentaje;
      });

      // Verificar que tenemos el periodo y su porcentaje antes de calcular
      if (!periodoActual?.porcentaje) {
        logger.error('No se encontró el porcentaje del periodo o el periodo es nulo');
        return [
          estudiante.identificacion,
          estudiante.apellidos,
          estudiante.nombres,
          ...notasComponentes.map(nota => nota || ''),
          notaPonderada.toFixed(2),
          '0.00'
        ];
      }

      // Calcular nota absoluta solo si hay una nota ponderada
      const notaAbsoluta = notaPonderada > 0 ? notaPonderada / (periodoActual.porcentaje / 100) : 0;

      return [
        estudiante.identificacion,
        estudiante.apellidos,
        estudiante.nombres,
        ...notasComponentes.map(nota => nota || ''),
        notaPonderada.toFixed(2),
        notaAbsoluta.toFixed(2)
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

    XLSX.utils.book_append_sheet(wb, ws, `Periodo ${periodoActual.nombre}`);
    XLSX.writeFile(wb, `calificaciones_periodo_${periodoActual.nombre}_${materia.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

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

    // Filtrar componentes por grupo
    const componentesDelGrupo = todosComponentes?.filter((g) => {
      // Asegurar que g tenga grupo_id antes de compararlos
      return (g as ComponenteCalificacionWithGrupo).grupo_id === grupo.id;
    }) || [];
    
    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Preparar los datos del encabezado
    const headerData = [
      [institucionName],
      ['REGISTRO DE CALIFICACIONES FINALES'],
      [''],
      [`Materia: ${materia.nombre}`],
      [`Grupo: ${grupo.nombre}`],
      [`Periodo Escolar: ${grupo.periodo_escolar || 'No definido'}`],
      [''],
      [''] // Línea en blanco antes de los datos
    ];

    // Preparar encabezados de columnas
    const columns = [
      'Identificación',
      'Apellidos',
      'Nombres'
    ];

    // Agregar columnas para cada periodo y sus componentes
    periodos.forEach(periodo => {
      // Agregar los componentes del periodo
      const componentesDelPeriodo = componentes.filter(c => c.periodo_id === periodo.id);
      componentesDelPeriodo.forEach(comp => {
        columns.push(`${periodo.nombre} - ${comp.nombre} (${comp.porcentaje}%)`);
      });
      // Agregar las notas del periodo
      columns.push(
        `${periodo.nombre} (Pond. ${periodo.porcentaje}%)`,
        `${periodo.nombre} (Abs.)`
      );
    });

    // Agregar columna de nota final
    columns.push('Nota Final');

    // Preparar datos de estudiantes
    const studentsData = estudiantes.map(estudiante => {
      const rowData = [
        estudiante.identificacion,
        estudiante.apellidos,
        estudiante.nombres
      ];

      // Agregar notas de cada periodo y sus componentes
      periodos.forEach(periodo => {
        const componentesPeriodo = componentes.filter(c => c.periodo_id === periodo.id);
        let notaPonderada = 0;
        let _porcentajeTotal = 0;

        // Agregar notas de los componentes
        componentesPeriodo.forEach(componente => {
          const nota = todasCalificaciones[estudiante.id]?.[componente.id] || 0;
          rowData.push(nota.toFixed(2));
          notaPonderada += nota * (componente.porcentaje / 100);
          _porcentajeTotal += componente.porcentaje;
        });

        // Calcular y agregar notas del periodo
        const notaAbsoluta = (notaPonderada > 0 && periodo.porcentaje > 0) 
          ? notaPonderada / (periodo.porcentaje / 100)
          : 0;

        rowData.push(notaPonderada.toFixed(2), notaAbsoluta.toFixed(2));
      });

      // Calcular nota final
      const notaFinal = componentesDelGrupo.reduce((acc, comp) => {
        const nota = todasCalificaciones[estudiante.id]?.[comp.id] || 0;
        return acc + (nota * (comp.porcentaje / 100));
      }, 0);

      rowData.push(notaFinal.toFixed(2));

      return rowData;
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

    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones Finales");
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
                          <td className="px-4 py-2 text-xs">{item.nombres} {item.apellidos}</td>
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