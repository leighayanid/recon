# theHarvester Docker Image
# Email and subdomain discovery tool

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash harvester

# Set working directory
WORKDIR /app

# Clone theHarvester repository
RUN git clone https://github.com/laramies/theHarvester.git /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements/base.txt

# Switch to non-root user
USER harvester

# Set entrypoint
ENTRYPOINT ["python3", "theHarvester.py"]

# Default command
CMD ["--help"]
