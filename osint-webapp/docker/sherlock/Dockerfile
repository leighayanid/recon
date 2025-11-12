# Sherlock Docker Image
# Username search tool

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash sherlock

# Set working directory
WORKDIR /app

# Clone Sherlock repository
RUN git clone https://github.com/sherlock-project/sherlock.git /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Switch to non-root user
USER sherlock

# Set entrypoint
ENTRYPOINT ["python3", "sherlock"]

# Default command (can be overridden)
CMD ["--help"]
