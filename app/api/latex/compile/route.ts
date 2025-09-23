import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

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
    const args = [
      `${jobName}.tex`,
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
    // In serverless environments this will likely fail; intended for Ubuntu server/Node runtime
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

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pv-tex-"));
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
