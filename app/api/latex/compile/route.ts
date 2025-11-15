import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { compileLatex, LaTeXServiceError } from "@/lib/services/latex-client";
import logger from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Feature flag for LaTeX service migration
const USE_NEW_LATEX_SERVICE = process.env.LATEX_USE_NEW_SERVICE === 'true';
const isVercel = process.env.VERCEL === '1';

// Basic guardrails
const MAX_TEX_SIZE_BYTES = 1_000_000; // 1 MB
const COMPILE_TIMEOUT_MS = 60_000; // 60s

function hasDangerousDirectives(tex: string): boolean {
  const lowered = tex.toLowerCase();
  // very conservative checks
  if (lowered.includes("\\write18")) return true;
  if (lowered.includes("shell-escape")) return true;
  return false;
}

function runTectonic(cwd: string, jobName: string): Promise<{ code: number; stdout: string; stderr: string }>{
  return new Promise((resolve) => {
    // Let tectonic write into current working directory (.) to avoid absolute path permission quirks
    const inputPath = path.join(cwd, `${jobName}.tex`);
    const args = [
      inputPath,
      "--outdir", ".",
      "--keep-logs",
      "--keep-intermediates",
      // no other flags; tectonic is non-interactive by default
    ];
    const child = spawn("tectonic", args, { cwd });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const killTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { child.kill("SIGKILL"); } catch (_e) { /* noop: process may already be dead */ }
        resolve({ code: -1, stdout, stderr: stderr + "\nTimeout exceeded" });
      }
    }, COMPILE_TIMEOUT_MS);

    child.stdout.on("data", (d) => { stdout += String(d); });
    child.stderr.on("data", (d) => { stderr += String(d); });

    child.on("close", (code) => {
      if (settled) return;
      clearTimeout(killTimer);
      settled = true;
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tex: string = body?.tex ?? "";
    const jobName: string = body?.options?.jobName ?? "exam";

    if (!tex || typeof tex !== "string") {
      return NextResponse.json({ error: "Body.tex requerido" }, { status: 400 });
    }
    if (Buffer.byteLength(tex, "utf8") > MAX_TEX_SIZE_BYTES) {
      return NextResponse.json({ error: "Archivo .tex demasiado grande" }, { status: 413 });
    }
    if (hasDangerousDirectives(tex)) {
      return NextResponse.json({ error: "Directivas LaTeX no permitidas detectadas" }, { status: 400 });
    }

    // In Vercel, MUST use the new service (no Tectonic available)
    // Otherwise, use new service if feature flag is enabled
    const useNewService = isVercel || USE_NEW_LATEX_SERVICE;

    if (useNewService) {
      logger.log(`[LaTeX] Using ${isVercel ? 'NEW (Vercel)' : 'NEW (flag enabled)'} LaTeX service`);

      try {
        const pdfBuffer = await compileLatex(tex, jobName);

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${jobName}.pdf"`,
            "Cache-Control": "no-store",
          },
        });
      } catch (error) {
        if (error instanceof LaTeXServiceError) {
          logger.error("[LaTeX] Service error:", error.message);

          // In Vercel, cannot fallback to local Tectonic
          if (isVercel) {
            return NextResponse.json({
              error: "LaTeX compilation failed",
              details: error.message,
              error_code: error.code,
              log: error.log
            }, { status: error.statusCode });
          }

          // On VPS, can fallback to local Tectonic
          logger.warn("[LaTeX] New service failed, falling back to local Tectonic");
        } else {
          logger.error("[LaTeX] Unexpected error:", error);

          if (isVercel) {
            return NextResponse.json({
              error: "LaTeX compilation failed",
              details: String(error)
            }, { status: 500 });
          }

          logger.warn("[LaTeX] Falling back to local Tectonic due to unexpected error");
        }

        // Fall through to use local Tectonic
      }
    }

    // Use local Tectonic (legacy/fallback)
    if (isVercel) {
      return NextResponse.json({
        error: "Tectonic not available in Vercel. Set LATEX_USE_NEW_SERVICE=true"
      }, { status: 500 });
    }

    logger.log("[LaTeX] Using local Tectonic");


    // Allow overriding the base work directory in environments where /tmp has noexec/restrictions
    const baseTmp = process.env.TEX_WORK_DIR_BASE && process.env.TEX_WORK_DIR_BASE.trim().length > 0
      ? process.env.TEX_WORK_DIR_BASE
      : os.tmpdir();
    const tmpDir = await fs.mkdtemp(path.join(baseTmp, "pv-tex-"));
    // Use a dedicated work directory where tectonic will write outputs
    const workDir = path.join(tmpDir, "work");
    await fs.mkdir(workDir, { recursive: true });
    const texPath = path.join(workDir, `${jobName}.tex`);
    await fs.writeFile(texPath, tex, { encoding: "utf8" });

    const { code, stdout, stderr } = await runTectonic(workDir, jobName);
    const logPayload = { code, cwd: workDir, stdout: stdout.slice(-4000), stderr: stderr.slice(-4000) };

    if (code !== 0) {
      // Try to read the .log to return helpful message
      let logText = "";
      try { logText = await fs.readFile(path.join(workDir, `${jobName}.log`), "utf8"); } catch (_e) { /* ignore: .log might not exist */ }
      return NextResponse.json({ error: "Fallo al compilar LaTeX", details: logPayload, log: logText.slice(-8000) }, { status: 422 });
    }

    const pdfPath = path.join(workDir, `${jobName}.pdf`);
    const pdf = await fs.readFile(pdfPath);

    // Clean tmp dir best-effort
    try {
      const entries = await fs.readdir(tmpDir);
      await Promise.all(entries.map(async (f) => {
        const p = path.join(tmpDir, f);
        try {
          await fs.rm(p, { recursive: true, force: true });
        } catch { /* ignore */ }
      }));
      try { await fs.rmdir(tmpDir); } catch { /* ignore */ }
    } catch (_e) { /* ignore: best-effort cleanup */ }

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${jobName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error interno al compilar", details: String(err) }, { status: 500 });
  }
}
