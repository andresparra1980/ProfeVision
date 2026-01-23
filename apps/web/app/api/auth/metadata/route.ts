import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Extract IP from Vercel headers or request
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "localhost";

    // Extract Vercel Geo headers
    const geo = {
        city: request.headers.get("x-vercel-ip-city") || "",
        country: request.headers.get("x-vercel-ip-country") || "",
        region: request.headers.get("x-vercel-ip-country-region") || "",
        latitude: request.headers.get("x-vercel-ip-latitude") || "",
        longitude: request.headers.get("x-vercel-ip-longitude") || "",
        timezone: request.headers.get("x-vercel-ip-timezone") || "",
    };

    return NextResponse.json({
        ip,
        geo,
        user_agent: request.headers.get("user-agent") || "",
    });
}
