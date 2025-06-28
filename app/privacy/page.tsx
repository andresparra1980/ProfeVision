import { SiteHeader } from '@/components/shared/site-header'
import { SiteFooter } from '@/components/shared/site-footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Empty spacer div to push content below fixed header */}
      <div className="h-16"></div>

      {/* Content */}
      <main className="legal-main flex-1 bg-background relative overflow-hidden">
        {/* Background gradient - same as hero section */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Política de Privacidad de ProfeVision</h1>
          <p className="text-lg text-muted-foreground mb-8">Vigente desde el 27 de junio de 2025</p>
          
          <div className="bg-card rounded-lg p-6 border mb-8">
            <p className="text-base leading-relaxed">
              En ProfeVision (www.profevision.com), nos tomamos muy en serio tu privacidad y la de tus estudiantes. 
              Queremos que sepas cómo usamos y protegemos tu información cuando usas nuestra aplicación o nuestro sitio web. 
              Aquí te explicamos, de manera sencilla y clara, todo lo que necesitas saber.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. ¿Quiénes somos?</h2>
            <p className="text-base leading-relaxed mb-4">
              Somos ProfeVision, una plataforma que ayuda a los profesores a calificar exámenes de opción múltiple 
              y analizar los resultados de sus estudiantes de forma rápida y sencilla. Puedes usar nuestra app o 
              nuestro sitio web para gestionar tus clases y exámenes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. ¿Qué información recopilamos?</h2>
            <p className="text-base leading-relaxed mb-4">Recopilamos dos tipos de información:</p>
            
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-3">a) Información de tu cuenta y uso</h3>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li><strong>Correo electrónico y contraseña:</strong> Para crear tu cuenta y poder identificarte.</li>
                  <li><strong>Datos de tu suscripción:</strong> Si tienes una suscripción paga, guardamos la información necesaria para gestionarla.</li>
                  <li><strong>Datos de uso:</strong> Recopilamos información sobre cómo usas ProfeVision, como la frecuencia con la que entras, desde qué dispositivos, tu dirección IP, tipo de navegador, etc.</li>
                  <li><strong>Cookies y tecnologías similares:</strong> Usamos cookies para que la plataforma funcione correctamente y para mejorar tu experiencia. No las usamos para publicidad.</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-3">b) Información que tú decides ingresar</h3>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li><strong>Datos de tus estudiantes:</strong> Si quieres, puedes ingresar nombres, apellidos, números de identificación y clases de tus estudiantes.</li>
                  <li><strong>Exámenes y resultados:</strong> Cuando calificas exámenes, puedes guardar imágenes y resultados para analizarlos después.</li>
                  <li><strong>Información de tus clases:</strong> Puedes crear registros de tus clases y vincularlos con tus estudiantes.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. ¿Para qué usamos tu información?</h2>
            <p className="text-base leading-relaxed mb-4">Usamos tu información para:</p>
            <ul className="space-y-2 list-disc list-inside text-sm ml-4">
              <li>Ofrecerte el servicio de ProfeVision y mejorarlo constantemente.</li>
              <li>Responder a tus dudas o consultas.</li>
              <li>Personalizar la plataforma para ti.</li>
              <li>Enviarte avisos importantes sobre tu cuenta, suscripción o novedades de ProfeVision.</li>
            </ul>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Nunca vendemos tu información ni la usamos para mostrarte publicidad.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. ¿Con quién compartimos tu información?</h2>
            <p className="text-base leading-relaxed mb-4">Solo compartimos tu información en estos casos:</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong>Cuando tú lo decides:</strong> Por ejemplo, si exportas resultados a otro sistema.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong>Con proveedores de servicios:</strong> Trabajamos con empresas que nos ayudan a enviar correos, alojar nuestros servidores o dar soporte técnico. Estas empresas solo usan tu información para ayudarnos y están obligadas a protegerla.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong>Por obligación legal:</strong> Si una autoridad lo exige, podemos compartir información para cumplir con la ley o proteger los derechos de ProfeVision y sus usuarios.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong>En caso de cambios en la empresa:</strong> Si ProfeVision es adquirida o se fusiona con otra empresa, te avisaremos y tu información seguirá protegida bajo esta política.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <strong>Con tu consentimiento:</strong> Nunca compartiremos tu información con terceros para otros fines sin tu permiso.
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. ¿Cómo protegemos tu información?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Tu cuenta está protegida con tu correo y una contraseña que solo tú conoces.</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Toda la información se transmite y almacena de forma cifrada.</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Revisamos y mejoramos constantemente nuestras medidas de seguridad.</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Si alguna vez ocurre una brecha de seguridad, te avisaremos lo antes posible.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. ¿Puedo decidir qué información compartir?</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-3 text-blue-800 dark:text-blue-200">¡Por supuesto!</h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li>• Puedes usar ProfeVision sin sincronizar tus datos con nuestros servidores.</li>
                <li>• Puedes eliminar o editar la información de tus estudiantes, clases y exámenes en cualquier momento.</li>
                <li>• Si quieres eliminar tu cuenta y todos tus datos, puedes hacerlo desde la sección &ldquo;Mi cuenta&rdquo;.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. ¿Cuánto tiempo guardamos tu información?</h2>
            <p className="text-base leading-relaxed mb-4">
              Si eliminas datos o tu cuenta, los borraremos de todos nuestros sistemas en un máximo de 60 días.
              Si tu cuenta está inactiva por mucho tiempo, también eliminaremos tus datos para proteger tu privacidad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. ¿Qué comunicaciones recibiré?</h2>
            <p className="text-base leading-relaxed">
              Te enviaremos correos solo para temas importantes: avisos de seguridad, información sobre tu cuenta, 
              novedades o soporte. Si no quieres recibir ciertos correos, puedes avisarnos en cualquier momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Cambios en esta política</h2>
            <p className="text-base leading-relaxed">
              Si cambiamos algo importante en esta política, te lo haremos saber por correo y cuando entres a la app o al sitio web. 
              Siempre podrás consultar la versión más actualizada en nuestro sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. ¿Tienes dudas o necesitas ayuda?</h2>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-base leading-relaxed mb-4">
                Si tienes preguntas sobre tu privacidad o sobre cómo manejamos tus datos, escríbenos a{" "}
                <a href="mailto:info@profevision.com" className="text-primary hover:underline font-medium">
                  info@profevision.com
                </a>. Estamos aquí para ayudarte.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">ProfeVision</p>
                <p>647 Santino Meadows Apt. 525</p>
                <p>Jeaniebury, Wisconsin 49368-5863</p>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
      </main>
      <SiteFooter />
    </div>
  )
} 