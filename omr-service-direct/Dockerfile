FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and zbar
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libzbar0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY omr_api_direct.py .
COPY omr_standalone.py .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8082

# Run the application
CMD ["uvicorn", "omr_api_direct:app", "--host", "0.0.0.0", "--port", "8082"]
