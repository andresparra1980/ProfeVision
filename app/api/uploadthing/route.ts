import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Verificar las variables de entorno en tiempo de ejecución
if (!process.env.UPLOADTHING_SECRET || !process.env.UPLOADTHING_APP_ID) {
  console.error("❌ Variables de entorno de UploadThing no configuradas correctamente");
}

// Exportar el manejador de rutas para la API con configuración apropiada
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Mostrar información detallada sobre errores en desarrollo
    isDev: process.env.NODE_ENV === "development",
  }
}); 