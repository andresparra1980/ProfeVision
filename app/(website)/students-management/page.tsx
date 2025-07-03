export default function StudentsManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Gestión de Estudiantes</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Control completo de la información estudiantil.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Funciones principales</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Registro y mantenimiento de datos estudiantiles</li>
              <li>• Historial académico completo</li>
              <li>• Importación masiva desde Excel</li>
              <li>• Generación de reportes personalizados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 