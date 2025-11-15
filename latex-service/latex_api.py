"""
ProfeVision LaTeX Compilation Service
FastAPI microservice for compiling LaTeX documents to PDF using Tectonic
"""

import asyncio
import logging
import os
import shutil
import tempfile
import time
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

# Configuration from environment
PORT = int(os.getenv("PORT", "8001"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
API_KEY = os.getenv("API_KEY", "")
MAX_TEX_SIZE_MB = int(os.getenv("MAX_TEX_SIZE_MB", "1"))
MAX_TEX_SIZE_BYTES = MAX_TEX_SIZE_MB * 1024 * 1024
COMPILE_TIMEOUT_SEC = int(os.getenv("COMPILE_TIMEOUT_SEC", "60"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="ProfeVision LaTeX Service",
    description="Microservice for compiling LaTeX documents to PDF",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track service uptime
START_TIME = time.time()


# Request/Response models
class CompileRequest(BaseModel):
    """LaTeX compilation request"""
    tex: str = Field(..., description="LaTeX source code", min_length=1)
    job_name: str = Field(default="exam", description="Output filename (without extension)", max_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "tex": "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}",
                "job_name": "exam"
            }
        }


class CompileResponse(BaseModel):
    """Successful compilation response"""
    success: bool = True
    job_name: str
    size_bytes: int
    compile_time_ms: float


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    error_code: str
    details: Optional[dict] = None
    log: Optional[str] = None


# Security validation
def has_dangerous_directives(tex: str) -> bool:
    """
    Check for dangerous LaTeX directives that could execute arbitrary commands
    """
    lowered = tex.lower()
    dangerous_patterns = [
        "\\write18",
        "shell-escape",
        "\\input{|",
        "\\openin",
        "\\openout",
    ]
    return any(pattern in lowered for pattern in dangerous_patterns)


# API Key middleware
async def verify_api_key(request: Request):
    """Verify API key if configured"""
    if not API_KEY:
        return  # No API key required

    provided_key = request.headers.get("X-API-Key")
    if not provided_key or provided_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )


async def run_tectonic(work_dir: Path, job_name: str) -> dict:
    """
    Run Tectonic compiler asynchronously

    Returns dict with: code, stdout, stderr
    """
    input_path = work_dir / f"{job_name}.tex"

    args = [
        "tectonic",
        str(input_path),
        "--outdir", str(work_dir),
        "--keep-logs",
        "--keep-intermediates",
    ]

    logger.info(f"Running Tectonic: {' '.join(args)}")

    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(work_dir)
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=COMPILE_TIMEOUT_SEC
            )

            return {
                "code": process.returncode,
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace")
            }
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail=f"LaTeX compilation timeout ({COMPILE_TIMEOUT_SEC}s)"
            )
    except FileNotFoundError:
        logger.error("Tectonic binary not found")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tectonic compiler not installed"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - START_TIME

    # Verify Tectonic is available
    try:
        process = await asyncio.create_subprocess_exec(
            "tectonic", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await process.communicate()
        tectonic_version = stdout.decode("utf-8").strip()
    except Exception as e:
        logger.error(f"Tectonic health check failed: {e}")
        tectonic_version = "ERROR: Not available"

    return {
        "status": "healthy",
        "service": "latex-compiler",
        "version": "1.0.0",
        "uptime_seconds": round(uptime, 2),
        "tectonic_version": tectonic_version
    }


@app.get("/")
async def root():
    """Service information"""
    return {
        "service": "ProfeVision LaTeX Compilation Service",
        "version": "1.0.0",
        "endpoints": {
            "compile": "POST /compile - Compile LaTeX to PDF",
            "health": "GET /health - Health check",
            "docs": "GET /docs - API documentation"
        }
    }


@app.post("/compile", dependencies=[Depends(verify_api_key)])
async def compile_latex(request: CompileRequest):
    """
    Compile LaTeX source code to PDF

    - **tex**: LaTeX source code
    - **job_name**: Output filename (default: "exam")

    Returns PDF file as binary response
    """
    start_time = time.time()

    # Validate input size
    tex_size = len(request.tex.encode("utf-8"))
    if tex_size > MAX_TEX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"LaTeX source too large ({tex_size} bytes, max {MAX_TEX_SIZE_BYTES})"
        )

    # Security check
    if has_dangerous_directives(request.tex):
        logger.warning(f"Dangerous LaTeX directives detected in request")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dangerous LaTeX directives detected (e.g., \\write18, shell-escape)"
        )

    # Sanitize job name
    job_name = "".join(c for c in request.job_name if c.isalnum() or c in "-_")
    if not job_name:
        job_name = "exam"

    logger.info(f"Starting LaTeX compilation: job_name={job_name}, size={tex_size} bytes")

    # Create temporary directory for compilation
    temp_dir = Path(tempfile.mkdtemp(prefix="pv-latex-"))

    try:
        # Write LaTeX source to file
        tex_path = temp_dir / f"{job_name}.tex"
        async with aiofiles.open(tex_path, "w", encoding="utf-8") as f:
            await f.write(request.tex)

        logger.debug(f"Wrote LaTeX source to {tex_path}")

        # Run Tectonic
        result = await run_tectonic(temp_dir, job_name)

        if result["code"] != 0:
            # Compilation failed - try to read log file
            log_path = temp_dir / f"{job_name}.log"
            log_content = ""

            if log_path.exists():
                async with aiofiles.open(log_path, "r", encoding="utf-8", errors="replace") as f:
                    log_content = await f.read()
                    log_content = log_content[-8000:]  # Last 8KB

            logger.error(f"LaTeX compilation failed: exit code {result['code']}")
            logger.error(f"STDERR: {result['stderr'][:1000]}")

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error": "LaTeX compilation failed",
                    "error_code": "COMPILATION_FAILED",
                    "details": {
                        "exit_code": result["code"],
                        "stdout": result["stdout"][-4000:],
                        "stderr": result["stderr"][-4000:]
                    },
                    "log": log_content
                }
            )

        # Read generated PDF
        pdf_path = temp_dir / f"{job_name}.pdf"

        if not pdf_path.exists():
            logger.error(f"PDF file not generated: {pdf_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF file was not generated despite successful compilation"
            )

        async with aiofiles.open(pdf_path, "rb") as f:
            pdf_content = await f.read()

        compile_time = (time.time() - start_time) * 1000  # ms

        logger.info(
            f"LaTeX compilation successful: "
            f"job_name={job_name}, "
            f"size={len(pdf_content)} bytes, "
            f"time={compile_time:.2f}ms"
        )

        # Return PDF as binary response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{job_name}.pdf"',
                "X-Compile-Time-Ms": str(round(compile_time, 2)),
                "X-PDF-Size-Bytes": str(len(pdf_content))
            }
        )

    finally:
        # Clean up temporary directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.debug(f"Cleaned up temp directory: {temp_dir}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp directory {temp_dir}: {e}")


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting LaTeX Service on port {PORT}")
    logger.info(f"API Key required: {bool(API_KEY)}")
    logger.info(f"Max LaTeX size: {MAX_TEX_SIZE_MB} MB")
    logger.info(f"Compile timeout: {COMPILE_TIMEOUT_SEC}s")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level=LOG_LEVEL.lower()
    )
