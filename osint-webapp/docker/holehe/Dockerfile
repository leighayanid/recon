# Holehe Docker Image
# Email to account finder

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash holehe

# Set working directory
WORKDIR /app

# Install holehe via pip
RUN pip install --no-cache-dir holehe

# Switch to non-root user
USER holehe

# Set entrypoint
ENTRYPOINT ["holehe"]

# Default command
CMD ["--help"]
