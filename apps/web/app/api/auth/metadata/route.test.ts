import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("API Metadata Route", () => {
    it("should extract IP and Geo data from headers", async () => {
        const request = {
            headers: new Headers({
                "x-forwarded-for": "1.2.3.4",
                "x-vercel-ip-city": "San Francisco",
                "x-vercel-ip-country": "US",
                "user-agent": "test-agent",
            }),
        } as unknown as NextRequest;

        const response = await GET(request);
        const data = await response.json();

        expect(data.ip).toBe("1.2.3.4");
        expect(data.geo.city).toBe("San Francisco");
        expect(data.geo.country).toBe("US");
        expect(data.user_agent).toBe("test-agent");
    });

    it("should handle missing headers with defaults", async () => {
        const request = {
            headers: new Headers({}),
        } as unknown as NextRequest;

        const response = await GET(request);
        const data = await response.json();

        expect(data.ip).toBe("localhost");
        expect(data.geo.city).toBe("");
    });
});
