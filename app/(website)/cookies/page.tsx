export default function CookiesPage() {
  return (
    <div className="legal-main bg-background relative overflow-hidden">
        {/* Background gradient - same as hero section */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Política de Cookies</h1>
          
          <div className="bg-card rounded-lg p-6 border mb-8">
            <p className="text-base leading-relaxed">
              Esta política explica cómo utilizamos las cookies en www.profevision.com para mejorar tu experiencia 
              de navegación y el funcionamiento de nuestro sitio web.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Consideraciones Previas</h2>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-base leading-relaxed mb-4">
                Se entenderá por <strong>usuario</strong> toda persona que navegue en el sitio web www.profevision.com. 
                Se entenderá por <strong>editor</strong> al dueño del sitio web, quien es ProfeVision y está identificado 
                en los términos y condiciones.
              </p>
              <p className="text-base leading-relaxed mb-4">
                Las cookies utilizadas en el navegador del usuario se han instalado con su autorización. Si en algún momento 
                desea revocar esta autorización, podrá hacerlo sin obstáculo alguno consultando la sección 
&ldquo;Desactivación o eliminación de cookies&rdquo;.
              </p>
              <p className="text-base leading-relaxed">
                El Editor está en total libertad de realizar cambios en el sitio web, por lo que se aconseja al usuario 
                verificar esta política cada vez que acceda al sitio web.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Definición y Función de las Cookies</h2>
            <p className="text-base leading-relaxed mb-4">
              Las cookies son informaciones que se almacenan en el navegador del usuario para consultar la actividad previa 
              y recordar ciertos datos para próximas visitas. También pueden ser llamadas web beacons, píxel, bugs o rastreadores.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Funciones principales:</h3>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Datos técnicos y estadísticas</li>
                  <li>• Personalización de perfiles</li>
                  <li>• Enlaces a redes sociales</li>
                  <li>• Preferencias personales</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Lo que NO son:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Virus o malware</li>
                  <li>• Spam o troyanos</li>
                  <li>• Spyware</li>
                  <li>• Publicidad emergente</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Tipos de Cookies</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-3">Según la Entidad que las Gestiona</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-border rounded-lg">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 font-medium">Propias</td>
                        <td className="px-4 py-3 text-sm">Gestionadas por ProfeVision desde nuestro propio dominio</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">De terceros</td>
                        <td className="px-4 py-3 text-sm">Gestionadas por entidades diferentes a ProfeVision</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Este sitio web utiliza cookies propias y de terceros.</p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-3">Según su Finalidad</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-border rounded-lg">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left font-medium">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-3 font-medium">Técnicas</td>
                        <td className="px-4 py-3 text-sm">Permiten la gestión operativa del sitio web</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">De personalización</td>
                        <td className="px-4 py-3 text-sm">Recordar características personalizadas de navegación</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">De análisis</td>
                        <td className="px-4 py-3 text-sm">Seguimiento y análisis del comportamiento de usuarios</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Publicitarias</td>
                        <td className="px-4 py-3 text-sm">Gestión eficaz de espacios publicitarios</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">De publicidad comportamental</td>
                        <td className="px-4 py-3 text-sm">Información basada en hábitos de navegación</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-3">Según su Duración</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium mb-2">De sesión</h4>
                    <p className="text-sm text-muted-foreground">Desaparecen al terminar la sesión de navegación</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Persistentes</h4>
                    <p className="text-sm text-muted-foreground">Se mantienen por un período definido</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies Utilizadas en Este Sitio Web</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                    <th className="px-4 py-3 text-left font-medium">Descripción</th>
                    <th className="px-4 py-3 text-left font-medium">Duración</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-mono text-sm">_Georgia_*</td>
                    <td className="px-4 py-3 text-sm">.profevision.com</td>
                    <td className="px-4 py-3 text-sm">Google Analytics para almacenar y contar visitas</td>
                    <td className="px-4 py-3 text-sm">1 año 1 mes 4 días</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                        Analítica
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-sm">_Georgia</td>
                    <td className="px-4 py-3 text-sm">.profevision.com</td>
                    <td className="px-4 py-3 text-sm">Calcula datos de visitantes, sesiones y campañas</td>
                    <td className="px-4 py-3 text-sm">1 año 1 mes 4 días</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                        Analítica
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-sm">tema</td>
                    <td className="px-4 py-3 text-sm">.profevision.com</td>
                    <td className="px-4 py-3 text-sm">Preferencias de tema del usuario</td>
                    <td className="px-4 py-3 text-sm">nunca</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-900/30 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                        Otro
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Consecuencias de Desactivar las Cookies</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-yellow-800 dark:text-yellow-200 mb-4 font-medium">
                Al desactivar las cookies, podrías experimentar las siguientes limitaciones:
              </p>
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• No se cargarán productos en la tienda, impidiendo finalizar compras</li>
                <li>• No podrás acceder al área de cliente o áreas que requieran confirmación</li>
                <li>• No se podrán recoger datos para analizar y mejorar el sitio web</li>
                <li>• No podrás compartir contenido en redes sociales</li>
                <li>• No podrás realizar comentarios en el blog</li>
                <li>• Limitaciones en el uso de redes sociales</li>
                <li>• No se mostrará publicidad de terceros</li>
                <li>• Tu navegación podría considerarse como spam</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Desactivación o Eliminación de Cookies</h2>
            <p className="text-base leading-relaxed mb-4">
              Puedes desactivar o eliminar las cookies en cualquier momento, salvo aquellas necesarias para el funcionamiento 
              del sitio web. Esta configuración debe realizarse en cada navegador.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-2">Chrome</h4>
                <a 
                  href="https://support.google.com/chrome/answer/95647?hl=en&co=GENIE.Platform%3DDesktop" 
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Ayuda de Chrome
                </a>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-2">Firefox</h4>
                <a 
                  href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" 
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Ayuda de Firefox
                </a>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-2">Safari</h4>
                <a 
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" 
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Ayuda de Safari
                </a>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-medium mb-2">Microsoft Edge</h4>
                <a 
                  href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d" 
                  className="text-sm text-primary hover:underline"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                >
                  Ayuda de IE
                </a>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Avisos Relacionados con las Cookies</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <p className="text-red-700 dark:text-red-300 mb-4">
                <strong>Importante:</strong> El Editor no se hace responsable por fallos técnicos que puedas encontrar 
                en el sitio web o navegador por manipular incorrectamente la desactivación o eliminación de cookies.
              </p>
              <p className="text-red-700 dark:text-red-300">
                Debes verificar la información sobre desactivación en la sección de ayuda de tu navegador. 
                Asumes la responsabilidad de eliminar o desactivar las cookies y las consecuencias que se deriven.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contacto</h2>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-base leading-relaxed">
                En todo momento puedes comunicarte con el Editor a través del correo electrónico:{" "}
                <a href="mailto:info@profevision.com" className="text-primary hover:underline font-medium">
                  info@profevision.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
    </div>
  )
} 