export default function MobileAppPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Aplicación Móvil</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Próximamente disponible - Accede a ProfeVision desde tu dispositivo móvil.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Funcionalidades planeadas</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Escaneo de exámenes con la cámara del teléfono</li>
              <li>• Acceso a calificaciones en tiempo real</li>
              <li>• Notificaciones de resultados</li>
              <li>• Interfaz optimizada para dispositivos móviles</li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
              🚧 En desarrollo - Mantente atento a las actualizaciones
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 