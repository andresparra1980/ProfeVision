export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">¿Cómo Funciona ProfeVision?</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          Descubre cómo transformar tu forma de crear, administrar y calificar exámenes.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Fácil de usar</h2>
            <p className="text-muted-foreground">
              Nuestra plataforma está diseñada para ser intuitiva y fácil de usar para profesores de todos los niveles tecnológicos.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Potente y completo</h2>
            <p className="text-muted-foreground">
              Desde la creación hasta la calificación, ProfeVision cubre todo el ciclo de vida de los exámenes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 