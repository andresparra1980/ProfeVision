/**
 * Utility to collect comprehensive browser and network metadata for analytics.
 */
export interface BrowserMetadata {
    // Network/Server-side
    ip?: string;
    geo?: {
        city?: string;
        country?: string;
        region?: string;
        latitude?: string;
        longitude?: string;
        timezone?: string;
    };

    // Client-side
    userAgent: string;
    language: string;
    platform: string;
    screenResolution: string;
    viewportSize: string;
    timezone: string;
    referrer: string;
    currentUrl: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    colorDepth: number;
    doNotTrack: string | null;
    timestamp: string;
}

/**
 * Collects all available browser and network metadata.
 */
export async function getBrowserMetadata(): Promise<Partial<BrowserMetadata>> {
    if (typeof window === "undefined") return {};

    const clientData: Partial<BrowserMetadata> = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: (navigator as unknown as { platform: string }).platform || "unknown",
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer,
        currentUrl: window.location.href,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as unknown as { deviceMemory: number }).deviceMemory,
        colorDepth: window.screen.colorDepth,
        doNotTrack: navigator.doNotTrack,
        timestamp: new Date().toISOString(),
    };

    try {
        // Fetch IP and Geo data from our internal API
        const response = await fetch("/api/auth/metadata", {
            cache: "no-store",
        });

        if (response.ok) {
            const serverData = await response.json();
            return {
                ...clientData,
                ip: serverData.ip,
                geo: serverData.geo,
            };
        }
    } catch (error) {
        console.warn("Failed to fetch network metadata:", error);
    }

    return clientData;
}
