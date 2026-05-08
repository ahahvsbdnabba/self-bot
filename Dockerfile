FROM python:3.11-slim

WORKDIR /app

# Copy requirements first (cache optimization)
COPY requirements.txt .

# Install system deps + Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove gcc

# Copy source
COPY . .

# Discord bot (no PORT needed)
CMD ["python", "main.py"]
