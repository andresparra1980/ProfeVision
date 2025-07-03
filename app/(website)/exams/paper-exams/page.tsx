export default function PaperExamsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Exámenes en Papel</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Escanea y califica exámenes físicos automáticamente con tu smartphone.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Tecnología de escaneo</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Reconocimiento óptico de marcas (OMR)</li>
              <li>• Escaneo con cámara de smartphone</li>
              <li>• Corrección automática de distorsiones</li>
              <li>• Detección de múltiples respuestas</li>
              <li>• Validación de calidad de imagen</li>
            </ul>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Proceso de calificación</h2>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">1</div>
                <h3 className="font-medium">Imprimir</h3>
                <p className="text-sm text-muted-foreground">Genera formato con códigos QR</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">2</div>
                <h3 className="font-medium">Aplicar</h3>
                <p className="text-sm text-muted-foreground">Estudiantes contestan en papel</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">3</div>
                <h3 className="font-medium">Escanear</h3>
                <p className="text-sm text-muted-foreground">Usa tu smartphone para escanear</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">4</div>
                <h3 className="font-medium">Calificar</h3>
                <p className="text-sm text-muted-foreground">Resultados automáticos instantáneos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 