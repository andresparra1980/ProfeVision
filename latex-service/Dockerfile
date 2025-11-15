# ProfeVision LaTeX Service - Docker Image
# Multi-stage build for optimized image size

# Stage 1: Builder
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies required for Tectonic
# Tectonic binary from official release (faster and smaller than building from source)
RUN apt-get update && apt-get install -y \
    # Download tools
    curl \
    ca-certificates \
    # Runtime dependencies for Tectonic (Debian 12/Bookworm compatible)
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    libicu-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Download and install Tectonic
# Using official pre-built binary for x86_64 Linux
RUN curl -L https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
    -o tectonic.tar.gz \
    && tar -xzf tectonic.tar.gz \
    && mv tectonic /usr/local/bin/tectonic \
    && chmod +x /usr/local/bin/tectonic \
    && rm tectonic.tar.gz

# Verify Tectonic installation
RUN tectonic --version

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install only runtime system dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    # Runtime dependencies for Tectonic (Debian 12/Bookworm compatible)
    libfontconfig1 \
    libgraphite2-3 \
    libharfbuzz0b \
    # Health check tool
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Tectonic binary from builder stage
COPY --from=builder /usr/local/bin/tectonic /usr/local/bin/tectonic

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY latex_api.py .

# Create directory for temporary LaTeX compilation
RUN mkdir -p /app/temp

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8001
ENV LOG_LEVEL=info

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "latex_api:app", "--host", "0.0.0.0", "--port", "8001"]
