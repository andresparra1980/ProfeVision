"use client";

// El proveedor no es necesario en la última versión de UploadThing
// Esta implementación es para mantener compatibilidad con versiones futuras
export function UploadThingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 