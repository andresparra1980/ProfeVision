"use client";

import { useState, useCallback } from "react";

/**
 * Hook para determinar qué endpoint OMR usar (legacy o direct)
 *
 * Features:
 * - Feature flag desde env var
 * - Fallback a legacy si direct falla
 * - Retorna URL y método de llamado
 */
export function useOMREndpoint() {
  const [usingDirect, setUsingDirect] = useState(
    process.env.NEXT_PUBLIC_USE_DIRECT_OMR === "true"
  );

  const directUrl = process.env.NEXT_PUBLIC_OMR_DIRECT_URL;
  const legacyUrl = "/api/omr/process"; // Via Vercel

  /**
   * Retorna la URL del endpoint a usar
   */
  const getEndpointUrl = useCallback(() => {
    if (usingDirect && directUrl) {
      return `${directUrl}/process`;
    }
    return legacyUrl;
  }, [usingDirect, directUrl]);

  /**
   * Marca que direct API falló y debe usar legacy
   */
  const fallbackToLegacy = useCallback(() => {
    console.warn("OMR Direct API failed, falling back to legacy");
    setUsingDirect(false);
  }, []);

  /**
   * Verifica si debe usar direct API
   */
  const shouldUseDirect = usingDirect && !!directUrl;

  return {
    endpointUrl: getEndpointUrl(),
    shouldUseDirect,
    fallbackToLegacy,
    directUrl,
    legacyUrl,
  };
}
