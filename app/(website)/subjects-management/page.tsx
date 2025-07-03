export default function SubjectsManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Gestión de Materias</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Organiza y gestiona todas tus materias de manera eficiente.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Funcionalidades</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Creación y organización de materias</li>
              <li>• Asociación con grupos y estudiantes</li>
              <li>• Configuración de criterios de evaluación</li>
              <li>• Historial de calificaciones por materia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 