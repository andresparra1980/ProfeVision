export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Blog</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Últimas noticias, consejos y actualizaciones sobre ProfeVision.
        </p>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Próximamente</h2>
            <p className="text-muted-foreground">
              Estamos preparando contenido valioso para educadores. Aquí encontrarás:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-4">
              <li>• Mejores prácticas en evaluación digital</li>
              <li>• Consejos para optimizar el tiempo de calificación</li>
              <li>• Casos de éxito de instituciones educativas</li>
              <li>• Novedades y actualizaciones de la plataforma</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 