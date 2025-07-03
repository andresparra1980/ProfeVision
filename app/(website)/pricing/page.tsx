export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Precios</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Planes flexibles para instituciones educativas de todos los tamaños.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Plan Básico</h2>
            <div className="text-3xl font-bold mb-4">$99/mes</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Hasta 100 estudiantes</li>
              <li>• Exámenes ilimitados</li>
              <li>• Reportes básicos</li>
              <li>• Soporte por email</li>
            </ul>
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-primary">
            <h2 className="text-2xl font-semibold mb-4">Plan Premium</h2>
            <div className="text-3xl font-bold mb-4">$199/mes</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Estudiantes ilimitados</li>
              <li>• Generación con IA</li>
              <li>• Reportes avanzados</li>
              <li>• Soporte prioritario</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 