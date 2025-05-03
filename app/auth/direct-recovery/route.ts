import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  // Extract tokens from URL
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const accessToken = requestUrl.searchParams.get("access_token");
  const refreshToken = requestUrl.searchParams.get("refresh_token");

  logger.auth("Direct recovery request received", {
    token: token ? "exists" : "missing",
    type,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    url: request.url,
  });

  // Build the redirect URL with all available tokens
  const redirectUrl = new URL("/auth/update-password", SITE_URL);

  // Add any tokens we have to the redirect
  if (token) redirectUrl.searchParams.set("token", token);
  if (type) redirectUrl.searchParams.set("type", type);
  if (accessToken) redirectUrl.searchParams.set("access_token", accessToken);
  if (refreshToken) redirectUrl.searchParams.set("refresh_token", refreshToken);

  // Add debugging flag
  redirectUrl.searchParams.set("source", "direct-recovery");

  logger.auth("Direct recovery redirecting", {
    destination: redirectUrl.toString(),
    type,
  });

  // Redirect to update-password with all tokens
  return NextResponse.redirect(redirectUrl);
}
