export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Contacto</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          ¿Tienes preguntas? Estamos aquí para ayudarte.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">Información de contacto</h2>
              <div className="space-y-3">
                <div>
                  <strong>Email:</strong> info@profevision.com
                </div>
                <div>
                  <strong>Teléfono:</strong> +1 (555) 123-4567
                </div>
                <div>
                  <strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">Soporte técnico</h2>
              <div className="space-y-3">
                <div>
                  <strong>Email:</strong> soporte@profevision.com
                </div>
                <div>
                  <strong>Chat en vivo:</strong> Disponible en la plataforma
                </div>
                <div>
                  <strong>Base de conocimientos:</strong> FAQ y guías
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 