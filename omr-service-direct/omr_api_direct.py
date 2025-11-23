"""
ProfeVision OMR Direct API
FastAPI service with direct client access, JWT auth, and WebP compression
"""

import os
import sys
import json
import time
import logging
import tempfile
import base64
import io
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import jwt
from PIL import Image, ImageOps

# Import the OMR processor
from omr_standalone import StandaloneOMRProcessor

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format='{"time":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}',
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ProfeVision OMR Direct API",
    description="Direct OMR processing with JWT auth and WebP compression",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Configuration
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
IMAGE_QUALITY = int(os.getenv("IMAGE_QUALITY", "80"))
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "800"))

# Service start time for uptime tracking
SERVICE_START_TIME = time.time()


# Pydantic Models
class Answer(BaseModel):
    """Individual answer from exam"""
    number: int = Field(..., description="Question number (1-based)")
    value: Optional[str] = Field(None, description="Answer value (A, B, C, D) or null")
    confidence: float = Field(0.0, description="Confidence score (0.0-1.0)")
    num_options: int = Field(4, description="Number of answer options")


class OMRResult(BaseModel):
    """OMR processing result"""
    success: bool = Field(..., description="Whether processing succeeded")
    qr_data: Optional[str] = Field(None, description="QR code data (colon-separated)")
    total_questions: int = Field(0, description="Total number of questions")
    answered_questions: int = Field(0, description="Number of answered questions")
    answers: List[Answer] = Field(default_factory=list, description="Detected answers")
    original_image: Optional[str] = Field(None, description="Base64 WebP original image")
    processed_image: Optional[str] = Field(None, description="Base64 WebP processed image")
    error: Optional[str] = Field(None, description="Error message if failed")
    error_code: Optional[str] = Field(None, description="Error code if failed")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    uptime_seconds: float


# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Log request
    logger.info({
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": round(duration * 1000, 2),
    })

    return response


# JWT Validation
async def verify_supabase_jwt(authorization: str = Header(None, alias="Authorization")):
    """
    Verify Supabase JWT token

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        JWT payload with user info

    Raises:
        HTTPException: If token is invalid, expired, or missing
    """
    if not SUPABASE_JWT_SECRET:
        logger.error("SUPABASE_JWT_SECRET not configured")
        raise HTTPException(
            status_code=500,
            detail="Server configuration error"
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Expected: Bearer <token>"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        logger.warning("JWT invalid audience")
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")


# Image Compression
def compress_to_webp(
    image_path: str,
    quality: int = IMAGE_QUALITY,
    max_dimension: int = MAX_IMAGE_DIMENSION
) -> str:
    """
    Compress image to WebP format matching Next.js compression

    Args:
        image_path: Path to image file
        quality: WebP quality (0-100)
        max_dimension: Maximum dimension in pixels

    Returns:
        Base64 data URL string
    """
    try:
        # Open image
        img = Image.open(image_path)

        # Auto-rotate based on EXIF
        img = ImageOps.exif_transpose(img)

        # Resize if too large (fit inside, maintain aspect ratio)
        if max(img.size) > max_dimension:
            ratio = max_dimension / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image from {img.size} to {new_size}")

        # Convert to WebP
        buffer = io.BytesIO()
        img.save(buffer, format='WEBP', quality=quality, method=6)
        buffer.seek(0)

        # Calculate compression ratio
        original_size = os.path.getsize(image_path)
        compressed_size = buffer.tell()
        ratio = original_size / compressed_size if compressed_size > 0 else 0

        logger.info(f"Compressed image: {original_size / 1024:.1f}KB → {compressed_size / 1024:.1f}KB (ratio: {ratio:.1f}x)")

        # Return base64 data URL
        img_b64 = base64.b64encode(buffer.read()).decode()
        return f"data:image/webp;base64,{img_b64}"

    except Exception as e:
        logger.error(f"Error compressing image: {str(e)}")
        raise


# Endpoints
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint - redirect to docs"""
    return {
        "service": "ProfeVision OMR Direct API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns service status and uptime
    """
    uptime = time.time() - SERVICE_START_TIME

    return HealthResponse(
        status="healthy",
        service="omr-direct",
        version="1.0.0",
        uptime_seconds=round(uptime, 2),
    )


@app.post("/process", response_model=OMRResult)
async def process_omr(
    file: UploadFile = File(..., description="Exam image file (JPEG or PNG)"),
    user: dict = Depends(verify_supabase_jwt),
):
    """
    Process an exam image with OMR

    Args:
        file: Uploaded image file
        user: JWT payload (injected by dependency)

    Returns:
        OMRResult with detected answers, QR data, and compressed images
    """
    start_time = time.time()
    temp_file_path = None
    debug_image_path = None

    user_id = user.get("sub", "unknown")
    logger.info(f"Processing request from user: {user_id}")

    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only JPEG and PNG allowed.",
            )

        # Read file content
        file_content = await file.read()

        # Validate file size
        if len(file_content) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {len(file_content)} bytes. Max: {MAX_IMAGE_SIZE_MB}MB",
            )

        # Create temporary file for processing
        suffix = ".jpg" if file.content_type == "image/jpeg" else ".png"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name

        logger.info(f"Processing image: {file.filename} ({len(file_content)} bytes)")

        # Initialize OMR processor (debug_mode=False for production performance)
        # The processed image with annotations is still generated
        processor = StandaloneOMRProcessor(debug_mode=False)

        # Process image
        result = processor.process_image(temp_file_path)

        # Parse result
        if not result:
            raise HTTPException(
                status_code=500,
                detail="OMR processing failed: No result returned",
            )

        # Check for errors in result
        if not result.get("success", False):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"OMR processing failed: {error_msg}")

            return OMRResult(
                success=False,
                error=error_msg,
                error_code="PROCESSING_FAILED",
                details=result.get("error_details", {}),
            )

        # Extract answers
        answers_data = result.get("answers", [])
        answers = [
            Answer(
                number=ans["number"],
                value=ans.get("value"),
                confidence=ans.get("confidence", 0.0),
                num_options=ans.get("num_options", 4),
            )
            for ans in answers_data
        ]

        # Compress original image
        logger.info("Compressing original image...")
        original_compressed = compress_to_webp(temp_file_path)

        # Compress processed image
        logger.info("Compressing processed image...")
        base_name = Path(temp_file_path).stem
        debug_image_path = str(Path(temp_file_path).parent / f"{base_name}questions_detected.jpeg")

        processed_compressed = None
        if os.path.exists(debug_image_path):
            processed_compressed = compress_to_webp(debug_image_path)
            # Clean up processed image after compression
            os.unlink(debug_image_path)
        else:
            logger.warning(f"Processed image not found at: {debug_image_path}")

        # Calculate processing time
        processing_time = time.time() - start_time
        logger.info(f"Processing completed in {processing_time:.2f}s for user: {user_id}")

        # Build response
        return OMRResult(
            success=True,
            qr_data=result.get("qr_data"),
            total_questions=result.get("total_questions", 0),
            answered_questions=result.get("answered_questions", 0),
            answers=answers,
            original_image=original_compressed,
            processed_image=processed_compressed,
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Unexpected error during OMR processing: {str(e)}", exc_info=True)

        return OMRResult(
            success=False,
            error=str(e),
            error_code="INTERNAL_ERROR",
            details={"exception_type": type(e).__name__},
        )

    finally:
        # Cleanup temporary files
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")


if __name__ == "__main__":
    # Run server
    port = int(os.getenv("PORT", "8082"))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"Starting OMR Direct service on {host}:{port}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    logger.info(f"Max image size: {MAX_IMAGE_SIZE_MB}MB")
    logger.info(f"Image quality: {IMAGE_QUALITY}")
    logger.info(f"Max dimension: {MAX_IMAGE_DIMENSION}px")
    logger.info(f"JWT auth: {'enabled' if SUPABASE_JWT_SECRET else 'disabled'}")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
