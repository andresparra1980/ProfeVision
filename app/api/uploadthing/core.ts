import { createUploadthing, type FileRouter } from "uploadthing/next";

// Función para generar un ID único compatible con navegadores antiguos
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Verificar que las variables de entorno están configuradas
if (!process.env.UPLOADTHING_SECRET || !process.env.UPLOADTHING_APP_ID) {
  console.error(
    "❌ UPLOADTHING_SECRET y UPLOADTHING_APP_ID deben estar definidas en .env.local"
  );
}

const f = createUploadthing();

export const ourFileRouter = {
  // Definir un endpoint para subidas de imágenes escaneadas
  examImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Esta función se ejecuta antes de la subida
      // Aquí podríamos verificar la autenticación si fuera necesario
      try {
        return { jobId: generateUniqueId() };
      } catch (error) {
        console.error("Error en el middleware de UploadThing:", error);
        throw new Error("Error al procesar la solicitud de subida");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // Esta función se ejecuta después de que la subida se completa
        console.log("Archivo subido:", file.name);
        // Usar ufsUrl en lugar de url (según advertencia de deprecación)
        console.log("URL del archivo:", file.ufsUrl || file.url);
        
        // Retornar información útil al cliente
        return {
          uploadedBy: metadata.jobId,
          url: file.ufsUrl || file.url
        };
      } catch (error) {
        console.error("Error en onUploadComplete:", error);
        return { error: "Ocurrió un error al procesar el archivo" };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 