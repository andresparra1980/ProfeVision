export default function InstitutionsManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Gestión de Instituciones</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Administra múltiples instituciones educativas desde una sola plataforma.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Características principales</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Gestión centralizada de múltiples instituciones</li>
              <li>• Control de accesos y permisos por institución</li>
              <li>• Reportes consolidados y por institución</li>
              <li>• Configuración personalizada por centro educativo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 