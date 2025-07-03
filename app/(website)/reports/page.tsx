export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Gestión de Reportes</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Análisis detallado del desempeño estudiantil con reportes avanzados.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Tipos de reportes</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Reportes individuales por estudiante</li>
              <li>• Análisis estadístico por grupo</li>
              <li>• Comparativas de desempeño</li>
              <li>• Reportes de progreso temporal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 