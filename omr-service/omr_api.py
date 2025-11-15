"""
ProfeVision OMR Processing Service
FastAPI wrapper for omr_standalone.py

This service provides HTTP endpoints for OMR (Optical Mark Recognition) processing.
"""

import os
import sys
import json
import time
import logging
import tempfile
import base64
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

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
    title="ProfeVision OMR Processing Service",
    description="Optical Mark Recognition service for automated exam grading",
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
API_KEY = os.getenv("API_KEY", "")
ENABLE_DEBUG_IMAGES = os.getenv("ENABLE_DEBUG_IMAGES", "false").lower() == "true"

# Service start time for uptime tracking
SERVICE_START_TIME = time.time()


# Pydantic Models
class Answer(BaseModel):
    """Individual answer from exam"""
    number: int = Field(..., description="Question number (1-based)")
    value: Optional[str] = Field(None, description="Answer value (A, B, C, D) or null")
    confidence: float = Field(0.0, description="Confidence score (0.0-1.0)")
    num_options: int = Field(4, description="Number of answer options")


class QRData(BaseModel):
    """QR code data structure"""
    examId: Optional[str] = None
    studentId: Optional[str] = None
    groupId: Optional[str] = None
    version: Optional[str] = None


class OMRResult(BaseModel):
    """OMR processing result"""
    success: bool = Field(..., description="Whether processing succeeded")
    qr_data: Optional[str] = Field(None, description="QR code data (colon-separated)")
    total_questions: int = Field(0, description="Total number of questions")
    answered_questions: int = Field(0, description="Number of answered questions")
    answers: List[Answer] = Field(default_factory=list, description="Detected answers")
    processed_image: Optional[str] = Field(None, description="Base64-encoded debug image")
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


# API Key verification
async def verify_api_key(x_api_key: str = Header(None, alias="X-API-Key")):
    """Verify API key if configured"""
    if API_KEY and x_api_key != API_KEY:
        logger.warning(f"Invalid API key attempt: {x_api_key}")
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns service status and uptime
    """
    uptime = time.time() - SERVICE_START_TIME

    return HealthResponse(
        status="healthy",
        service="omr-processor",
        version="1.0.0",
        uptime_seconds=round(uptime, 2),
    )


@app.post("/process", response_model=OMRResult)
async def process_omr(
    file: UploadFile = File(..., description="Exam image file (JPEG or PNG)"),
    debug: bool = False,
    x_api_key: str = Header(None, alias="X-API-Key"),
):
    """
    Process an exam image with OMR

    Args:
        file: Uploaded image file
        debug: Enable debug image generation
        x_api_key: API key for authentication

    Returns:
        OMRResult with detected answers and QR data
    """
    # Verify API key
    if API_KEY:
        await verify_api_key(x_api_key)

    start_time = time.time()
    temp_file_path = None
    debug_image_path = None

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

        # Initialize OMR processor
        processor = StandaloneOMRProcessor(debug_mode=debug or ENABLE_DEBUG_IMAGES)

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

        # Handle processed image (always generate, as it's core functionality)
        processed_image_b64 = None

        # Look for processed image generated by omr_standalone.py
        # The script always generates this file with suffix "questions_detected.jpeg"
        base_name = Path(temp_file_path).stem
        debug_image_path = str(Path(temp_file_path).parent / f"{base_name}questions_detected.jpeg")

        logger.info(f"Looking for processed image at: {debug_image_path}")

        if os.path.exists(debug_image_path):
            try:
                with open(debug_image_path, "rb") as img_file:
                    img_data = img_file.read()
                    processed_image_b64 = f"data:image/jpeg;base64,{base64.b64encode(img_data).decode()}"
                    logger.info(f"Processed image loaded: {len(img_data)} bytes")

                # Clean up the debug image after reading
                os.unlink(debug_image_path)
            except Exception as img_error:
                logger.warning(f"Failed to read processed image: {img_error}")
        else:
            logger.warning(f"Processed image not found at: {debug_image_path}")

        # Calculate processing time
        processing_time = time.time() - start_time
        logger.info(f"Processing completed in {processing_time:.2f}s")

        # Build response
        return OMRResult(
            success=True,
            qr_data=result.get("qr_data"),
            total_questions=result.get("total_questions", 0),
            answered_questions=result.get("answered_questions", 0),
            answers=answers,
            processed_image=processed_image_b64,
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

        # Note: debug_image_path is already cleaned up in the try block after reading


@app.get("/")
async def root():
    """Root endpoint - redirect to docs"""
    return {
        "service": "ProfeVision OMR Processing Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    # Run server
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"Starting OMR service on {host}:{port}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    logger.info(f"Max image size: {MAX_IMAGE_SIZE_MB}MB")
    logger.info(f"Debug images: {ENABLE_DEBUG_IMAGES}")
    logger.info(f"API key authentication: {'enabled' if API_KEY else 'disabled'}")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
