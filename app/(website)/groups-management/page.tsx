export default function GroupsManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Gestión de Grupos</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Administra grupos y estudiantes de manera eficiente.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Características</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Organización de estudiantes en grupos</li>
              <li>• Asignación de materias a grupos</li>
              <li>• Gestión de horarios y períodos</li>
              <li>• Seguimiento del progreso grupal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 