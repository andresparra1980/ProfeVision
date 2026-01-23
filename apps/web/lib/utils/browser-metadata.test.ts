import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBrowserMetadata } from "./browser-metadata";

describe("getBrowserMetadata", () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        // Mock navigator and window
        Object.defineProperty(global, 'navigator', {
            value: {
                userAgent: "test-agent",
                language: "en-US",
                platform: "test-platform",
                hardwareConcurrency: 8,
                deviceMemory: 16,
                doNotTrack: "1",
            },
            writable: true
        });

        Object.defineProperty(global, 'window', {
            value: {
                screen: {
                    width: 1920,
                    height: 1080,
                    colorDepth: 24,
                },
                innerWidth: 1024,
                innerHeight: 768,
                location: {
                    href: "http://localhost/auth/register",
                },
            },
            writable: true
        });

        Object.defineProperty(global, 'document', {
            value: {
                referrer: "http://google.com",
            },
            writable: true
        });

        // Mock fetch
        global.fetch = vi.fn();
    });

    it("should collect client-side metadata correctly", async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ ip: "127.0.0.1", geo: { city: "Local" } }),
        });

        const metadata = await getBrowserMetadata();

        expect(metadata.userAgent).toBe("test-agent");
        expect(metadata.language).toBe("en-US");
        expect(metadata.screenResolution).toBe("1920x1080");
        expect(metadata.viewportSize).toBe("1024x768");
        expect(metadata.ip).toBe("127.0.0.1");
        expect(metadata.geo?.city).toBe("Local");
    });

    it("should handle fetch failure gracefully", async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

        const metadata = await getBrowserMetadata();

        expect(metadata.userAgent).toBe("test-agent");
        expect(metadata.ip).toBeUndefined();
    });
});
