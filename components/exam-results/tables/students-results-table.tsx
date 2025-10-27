import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { Estudiante, ResultadoExamen } from '../utils/types';

interface StudentsResultsTableProps {
  todosEstudiantes: Estudiante[];
  resultados: ResultadoExamen[];
  verSoloConExamen: boolean;
  onShowDetails: (_resultado: ResultadoExamen) => void;
  onShowManualGrade: (_estudiante: Estudiante) => void;
}

export function StudentsResultsTable({
  todosEstudiantes,
  resultados,
  verSoloConExamen,
  onShowDetails,
  onShowManualGrade
}: StudentsResultsTableProps) {
  const t = useTranslations('dashboard.exams.results');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('studentsSection')}</CardTitle>
        <CardDescription>
          {t('studentsSectionDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {todosEstudiantes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('emptyState.noResultsMessage')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="py-2 px-4 text-left">{t('table.name')}</th>
                  <th className="py-2 px-4 text-left">{t('table.identification')}</th>
                  <th className="py-2 px-4 text-center">{t('table.score')}</th>
                  <th className="py-2 px-4 text-center">{t('table.percentage')}</th>
                  <th className="py-2 px-4 text-center">{t('table.status')}</th>
                  <th className="py-2 px-4 text-center">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {todosEstudiantes
                  .filter(estudiante => {
                    if (!verSoloConExamen) return true;
                    return resultados.some(r => r.estudiante.id === estudiante.id);
                  })
                  .map(estudiante => {
                    const resultado = resultados.find(r => r.estudiante.id === estudiante.id);
                    return (
                      <tr key={estudiante.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{estudiante.apellidos}, {estudiante.nombres}</td>
                        <td className="py-2 px-4">{estudiante.identificacion}</td>
                        <td className="py-2 px-4 text-center">
                          {resultado ? resultado.puntaje_obtenido.toFixed(2) : '-'}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {resultado ? resultado.porcentaje.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {resultado ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground font-medium shadow-sm">
                              {t('status.graded')}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground font-medium shadow-sm">
                              {t('status.notPresented')}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {resultado ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onShowDetails(resultado)}
                            >
                              {t('viewDetailsButton')}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onShowManualGrade(estudiante)}
                            >
                              {t('dialogs.enterGrade')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
