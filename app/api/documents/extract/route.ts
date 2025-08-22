import { NextResponse } from "next/server";

export const runtime = "nodejs"; // required for fs/buffer and pdf/mammoth libs
export const dynamic = "force-dynamic"; // no caching

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const name = file.name || "document";
    const mime = file.type || "";

    let text = "";
    let pageCount: number | undefined = undefined;

    const lowerName = (name || "").toLowerCase();
    const lowerMime = (mime || "").toLowerCase();

    const isPdf =
      lowerName.endsWith(".pdf") ||
      lowerMime.includes("pdf") ||
      lowerMime === "application/x-pdf" ||
      lowerMime === "application/pdf";
    const isDocx =
      lowerName.endsWith(".docx") ||
      lowerMime.includes("wordprocessingml") ||
      lowerMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      // some browsers mislabel docx as generic zip
      lowerMime === "application/zip" ||
      // occasionally reported as msword
      lowerMime.includes("msword");
    const isDoc = lowerName.endsWith(".doc") || lowerMime === "application/msword";

    if (isPdf) {
      // Use unpdf (serverless-friendly wrapper over pdf.js)
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { totalPages, text: pdfText } = await extractText(pdf, { mergePages: true });
      pageCount = typeof totalPages === "number" ? totalPages : undefined;
      text = (pdfText || "").trim();
    } else if (isDocx || isDoc) {
      // DOCX: use mammoth with Buffer in Node.js runtime
      if (isDoc) {
        return NextResponse.json({ error: "Unsupported file type: legacy .doc is not supported" }, { status: 415 });
      }
      const mammothNS = await import("mammoth");
      const mammothLib: any = (mammothNS as any).default || (mammothNS as any);
      try {
        // First attempt: Node Buffer
        const result = await mammothLib.extractRawText({ buffer });
        text = (result?.value || "").trim();
      } catch (e: any) {
        console.error("/api/documents/extract mammoth error (buffer)", e?.message || e);
        try {
          // Fallback: ArrayBuffer (some environments prefer this)
          const result2 = await mammothLib.extractRawText({ arrayBuffer });
          text = (result2?.value || "").trim();
        } catch (e2: any) {
          console.error("/api/documents/extract mammoth error (arrayBuffer)", e2?.message || e2);
          try {
            // Final fallback: convert to HTML then strip tags to approximate text
            const htmlRes = await mammothLib.convertToHtml({ buffer });
            const html = (htmlRes?.value || "").toString();
            const stripped = html
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            text = stripped;
          } catch (e3: any) {
            console.error("/api/documents/extract mammoth error (html fallback)", e3?.message || e3);
            return NextResponse.json({ error: "Failed to extract DOCX content" }, { status: 422 });
          }
        }
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    // Basic sanitization
    text = text.replace(/\u0000/g, "");

    return NextResponse.json({
      text,
      meta: { mime: mime || "application/octet-stream", fileName: name, length: text.length, pageCount },
    });
  } catch (err) {
    console.error("/api/documents/extract error", err);
    return NextResponse.json({ error: "Failed to extract text" }, { status: 500 });
  }
}
