import Link from "next/link"
import { SiteHeader } from '@/components/shared/site-header'
import { SiteFooter } from '@/components/shared/site-footer'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-8">Términos y Condiciones de ProfeVision</h1>
          <p className="text-lg text-muted-foreground mb-8">Vigente desde el 27 de junio de 2025</p>
          
          <div className="bg-card rounded-lg p-6 border mb-8">
            <p className="text-base leading-relaxed">
              Gracias por tu interés en ProfeVision (&ldquo;ProfeVision&rdquo;, &ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;), que ofrece los servicios 
              disponibles en www.profevision.com y en nuestras aplicaciones móviles. Al usar ProfeVision, aceptas estos 
              Términos y nuestra Política de Privacidad. Por favor, léelos con atención.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p className="text-base leading-relaxed">
              Al crear una cuenta, acceder o usar ProfeVision, aceptas cumplir con estos Términos y nuestra Política de Privacidad. 
              Si usas ProfeVision en nombre de una institución educativa o empresa, asegúrate de tener la autoridad para aceptar 
              estos Términos en su nombre.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Quién puede usar ProfeVision</h2>
            <ul className="space-y-2 list-disc list-inside text-base">
              <li>Debes ser mayor de 18 años o contar con la autorización de tus padres/tutores y tu institución educativa.</li>
              <li>Si representas a una institución, garantizas que tienes permiso para aceptar estos Términos en su nombre.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Uso adecuado del servicio</h2>
            <p className="text-base leading-relaxed mb-4">Al usar ProfeVision, te comprometes a:</p>
            <div className="bg-muted/50 rounded-lg p-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Proporcionar información real y actualizada sobre ti y tu institución.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No usar ProfeVision para actividades ilegales, dañinas, fraudulentas, abusivas o que violen derechos de otras personas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No intentar acceder a cuentas de otros usuarios ni compartir tu contraseña.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No usar robots, scrapers u otros medios automáticos para recopilar información sin permiso.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No sobrecargar, dañar o interferir con el funcionamiento de ProfeVision.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No suplantar a otras personas ni falsear tu identidad.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>No facilitar ni fomentar el incumplimiento de estos Términos.</span>
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Si incumples alguna de estas reglas, podemos suspender o cancelar tu cuenta.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Tu información y privacidad</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• Al usar ProfeVision, puedes ingresar información personal y de tus estudiantes.</li>
                  <li>• <strong>Tú eres el dueño de esa información.</strong></li>
                  <li>• Nos das permiso para usar, almacenar y procesar esa información solo para brindarte el servicio.</li>
                  <li>• Puedes eliminar tu información y tu cuenta en cualquier momento.</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Consulta nuestra <Link href="/privacy" className="text-primary hover:underline font-medium">Política de Privacidad</Link> para saber más sobre cómo protegemos tus datos.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Uso de ProfeVision en instituciones educativas</h2>
            <p className="text-base leading-relaxed mb-4">Si eres profesor o personal de una institución educativa:</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Garantizas que tienes autorización para usar ProfeVision con tus estudiantes.</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Cumples con las leyes de privacidad y protección de datos aplicables (como la FERPA en EE. UU. o la LOPI en otros países).</p>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Nota:</strong> Si tu institución no quiere que los datos de los estudiantes se almacenen en nuestros servidores, 
                puedes desactivar la sincronización desde tu cuenta.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Propiedad intelectual</h2>
            <div className="bg-muted/50 rounded-lg p-6">
              <ul className="space-y-2 text-sm">
                <li>• ProfeVision y su tecnología están protegidos por derechos de autor y otras leyes.</li>
                <li>• No puedes copiar, modificar, distribuir, vender, descompilar ni usar nuestra tecnología o marca para otros fines sin nuestro permiso.</li>
                <li>• El uso de ProfeVision no te da derechos sobre nuestra propiedad intelectual.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cambios en los Términos</h2>
            <p className="text-base leading-relaxed">
              Podemos actualizar estos Términos para reflejar cambios en la ley o en nuestros servicios. Te avisaremos de los cambios importantes. 
              Si sigues usando ProfeVision después de los cambios, se considerará que los aceptas. Si no estás de acuerdo, puedes dejar de usar 
              el servicio y eliminar tu cuenta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Funciones experimentales</h2>
            <p className="text-base leading-relaxed">
              A veces probamos nuevas funciones que pueden cambiar o desaparecer sin previo aviso. No garantizamos que funcionen siempre.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitación de responsabilidad</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• ProfeVision se ofrece &ldquo;tal cual&rdquo;, sin garantías de que siempre estará disponible o libre de errores.</li>
                <li>• No somos responsables de daños indirectos, pérdidas de datos o cualquier daño que surja del uso o la imposibilidad de usar ProfeVision.</li>
                <li>• Nuestra responsabilidad máxima hacia ti no superará el monto que hayas pagado por el servicio en los últimos 12 meses o $100 USD, lo que sea mayor.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Seguridad y registro</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Debes mantener tu contraseña segura y no compartir tu cuenta.</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm">Si detectas un uso no autorizado de tu cuenta, avísanos de inmediato a info@profevision.com.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnización</h2>
            <p className="text-base leading-relaxed">
              Si alguien hace un reclamo contra ProfeVision relacionado con tu uso del servicio, aceptas defendernos y cubrir cualquier gasto o daño que esto cause.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Cancelación de la cuenta</h2>
            <p className="text-base leading-relaxed">
              Puedes cancelar tu cuenta en cualquier momento desde la sección &ldquo;Mi cuenta&rdquo; o escribiéndonos a info@profevision.com. 
              Nosotros también podemos suspender o cancelar tu cuenta si incumples estos Términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Resolución de disputas</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Si surge un conflicto entre tú y ProfeVision, intentaremos resolverlo de buena fe. Si no es posible, cualquier disputa se resolverá mediante arbitraje en Chicago, Illinois, bajo las reglas de la Asociación Americana de Arbitraje (AAA).
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Al aceptar estos Términos, renuncias al derecho a un juicio por jurado o a participar en demandas colectivas.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Misceláneas</h2>
            <ul className="space-y-2 list-disc list-inside text-base">
              <li>Si alguna parte de estos Términos no es válida, el resto sigue vigente.</li>
              <li>No puedes transferir tu cuenta sin nuestro permiso.</li>
              <li>Estos Términos constituyen el acuerdo completo entre tú y ProfeVision.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contacto</h2>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-base leading-relaxed mb-4">
                Si tienes dudas o necesitas ayuda, escríbenos a{" "}
                <a href="mailto:info@profevision.com" className="text-primary hover:underline font-medium">
                  info@profevision.com
                </a> o a:
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