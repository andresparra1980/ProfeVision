export default function AIGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Generador de Exámenes con IA</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Genera exámenes automáticamente con inteligencia artificial avanzada.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Potencia de la IA</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Generación automática basada en contenido del curso</li>
              <li>• Preguntas adaptadas al nivel educativo</li>
              <li>• Múltiples modelos de IA disponibles (GPT-4, Claude, Mixtral)</li>
              <li>• Revisión y edición posterior</li>
              <li>• Generación de distractores inteligentes</li>
            </ul>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Modelos de IA disponibles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">GPT-4 & Claude 3 Opus</h3>
                <p className="text-sm text-muted-foreground">Para exámenes de alta calidad y complejidad</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Claude 3 Haiku</h3>
                <p className="text-sm text-muted-foreground">Para verificación rápida y revisión</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Mixtral & Llama 3</h3>
                <p className="text-sm text-muted-foreground">Para tareas menos complejas y eficiencia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 