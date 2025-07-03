export default function ManualGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Generador Manual de Exámenes</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Crea exámenes paso a paso con control total sobre cada pregunta.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Características principales</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Editor intuitivo para preguntas de opción múltiple</li>
              <li>• Configuración personalizada de respuestas</li>
              <li>• Organización por categorías y dificultad</li>
              <li>• Vista previa en tiempo real</li>
              <li>• Banco de preguntas reutilizable</li>
            </ul>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Proceso de creación</h2>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">1</div>
                <h3 className="font-medium">Crear preguntas</h3>
                <p className="text-sm text-muted-foreground">Redacta tus preguntas y opciones</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">2</div>
                <h3 className="font-medium">Configurar examen</h3>
                <p className="text-sm text-muted-foreground">Establece parámetros y formato</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold mx-auto">3</div>
                <h3 className="font-medium">Generar y aplicar</h3>
                <p className="text-sm text-muted-foreground">Imprime o aplica digitalmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 