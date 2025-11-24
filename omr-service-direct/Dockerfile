# ProfeVision OMR Direct API - Docker Image
# Multi-stage build for optimized image size

# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    # OpenCV dependencies (Debian 12/Bookworm)
    libgl1 \
    libglib2.0-0 \
    # pyzbar dependencies
    libzbar0 \
    # Build tools
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    # OpenCV runtime (Debian 12/Bookworm)
    libgl1 \
    libglib2.0-0 \
    # pyzbar runtime
    libzbar0 \
    # Health check tool
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY omr_api_direct.py .
COPY omr_standalone.py .

# Create directories
RUN mkdir -p /app/logs /app/temp

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8082
ENV LOG_LEVEL=info

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "omr_api_direct:app", "--host", "0.0.0.0", "--port", "8082"]
