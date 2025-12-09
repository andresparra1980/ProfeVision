import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

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

    // Debug logging
    logger.api("/api/documents/extract - File received", { name, mime, size: file.size });

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
    const isPptx =
      lowerName.endsWith(".pptx") ||
      lowerMime === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    const isImage =
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp") ||
      lowerMime.startsWith("image/");

    // Debug logging for file type detection
    logger.api("/api/documents/extract - File type detection", { isPdf, isDocx, isDoc, isPptx, isImage });

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
      type ExtractRawTextFn = (_input: { buffer?: Buffer; arrayBuffer?: ArrayBuffer }) => Promise<{ value?: string }>;
      const mammothMod = mammothNS as unknown as { extractRawText?: ExtractRawTextFn; default?: { extractRawText?: ExtractRawTextFn } };
      const extractRawTextFn: ExtractRawTextFn | undefined = mammothMod.extractRawText ?? mammothMod.default?.extractRawText;
      if (!extractRawTextFn) {
        return NextResponse.json({ error: "Mammoth library not available" }, { status: 500 });
      }
      try {
        // First attempt: Node Buffer
        const result = await extractRawTextFn({ buffer });
        text = (result?.value || "").trim();
      } catch (e: unknown) {
        logger.error("/api/documents/extract - Mammoth error (buffer)", e);
        try {
          // Fallback: ArrayBuffer (some environments prefer this)
          const result2 = await extractRawTextFn({ arrayBuffer });
          text = (result2?.value || "").trim();
        } catch (e2: unknown) {
          logger.error("/api/documents/extract - Mammoth error (arrayBuffer)", e2);
          return NextResponse.json({ error: "Failed to extract DOCX content" }, { status: 422 });
        }
      }
    } else if (isPptx) {
      // PPTX: unzip and extract text from slides XML; images are ignored
      try {
        const JSZip = (await import("jszip")).default;
        const { XMLParser } = await import("fast-xml-parser");
        const zip = await JSZip.loadAsync(buffer);
        const slideFiles = Object.keys(zip.files).filter((p) => p.startsWith("ppt/slides/slide") && p.endsWith(".xml"));
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const chunks: string[] = [];
        for (const path of slideFiles.sort()) {
          const xmlStr = await zip.files[path].async("string");
          const xml = parser.parse(xmlStr);
          // Collect text nodes commonly under a:p/a:r/a:t in PPTX
          const visit = (node: unknown) => {
            if (!node || typeof node !== "object") return;
            for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
              if (key.endsWith(":t") || key === "a:t" || key === "t") {
                if (typeof val === "string") chunks.push(val);
              } else if (Array.isArray(val)) {
                (val as unknown[]).forEach(visit);
              } else if (typeof val === "object") {
                visit(val);
              }
            }
          };
          visit(xml);
        }
        text = chunks.join("\n").trim();
      } catch (e: unknown) {
        logger.error("/api/documents/extract - PPTX error", e);
        return NextResponse.json({ error: "Failed to extract PPTX text" }, { status: 500 });
      }
    } else if (isImage) {
      // IMAGES: return base64 data URL via meta; summarization route will handle vision model
      const base64 = Buffer.from(buffer).toString("base64");
      // Fallback to a concrete supported MIME instead of image/*
      const safeMime = mime && /^image\/(png|jpe?g|webp|gif)$/i.test(mime) ? mime : "image/jpeg";
      const dataUrl = `data:${safeMime};base64,${base64}`;
      return NextResponse.json({ text: "", meta: { mime, fileName: name, length: buffer.byteLength, kind: "image", dataUrl } });
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    // Basic sanitization: remove NUL characters without regex to satisfy no-control-regex
    if (text.includes("\u0000")) {
      text = text.split("\u0000").join("");
    }

    return NextResponse.json({
      text,
      meta: { mime: mime || "application/octet-stream", fileName: name, length: text.length, pageCount },
    });
  } catch (err) {
    logger.error("/api/documents/extract - Unexpected error", err);
    return NextResponse.json({ error: "Failed to extract text" }, { status: 500 });
  }
}
