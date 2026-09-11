FROM python:3.12-slim

WORKDIR /app

# Prevent python from buffering stdout/stderr (avoids pipe issues in container logs)
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install lightweight CPU-only PyTorch to prevent massive CUDA download and BrokenPipeError on Render
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy backend requirements and install with extended timeout
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --default-timeout=100 -r backend/requirements.txt

# Copy application files
COPY backend ./backend
COPY data ./data

EXPOSE 8000

ENV PORT=8000
ENV HOST=0.0.0.0

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

