# ExifTool Docker Image
# Image metadata extraction tool

FROM perl:5.38-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash exiftool

# Set working directory
WORKDIR /app

# Install ExifTool
RUN wget https://exiftool.org/Image-ExifTool-12.70.tar.gz && \
    tar -xzf Image-ExifTool-12.70.tar.gz && \
    cd Image-ExifTool-12.70 && \
    perl Makefile.PL && \
    make && \
    make install && \
    cd .. && \
    rm -rf Image-ExifTool-12.70*

# Switch to non-root user
USER exiftool

# Set entrypoint
ENTRYPOINT ["exiftool"]

# Default command
CMD ["--help"]
