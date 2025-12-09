import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Type for params in Next.js 15
type PathParams = Promise<{ path: string[] }>;

// API route to serve images with CORS headers enabled
export async function GET(
  request: NextRequest,
  { params }: { params: PathParams }
) {
  try {
    // Resolve params (Next.js 15 wraps params in a Promise)
    const resolvedParams = await params;

    // Reconstruct the file path
    const filePath = resolvedParams.path.join("/");

    // Build full path to the file on the system
    const publicDir = path.join(process.cwd(), "public");
    const fullPath = path.join(publicDir, filePath);

    // Validate that the path doesn't go outside the public directory (prevent path traversal)
    const normalizedFullPath = path.normalize(fullPath);
    if (!normalizedFullPath.startsWith(publicDir)) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Check if the file exists
    if (!existsSync(normalizedFullPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file
    const fileData = await readFile(normalizedFullPath);

    // Determine MIME type based on extension
    const ext = path.extname(normalizedFullPath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
    }

    // Set headers for caching and content type, including CORS headers
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400", // 1 day cache
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // Return the image with appropriate headers
    return new NextResponse(fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  });

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
