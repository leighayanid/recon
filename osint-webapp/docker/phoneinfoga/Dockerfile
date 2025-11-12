# PhoneInfoga Docker Image
# Phone number OSINT tool

FROM alpine:latest

# Install dependencies
RUN apk add --no-cache ca-certificates wget

# Create non-root user
RUN adduser -D -u 1000 phoneinfoga

# Set working directory
WORKDIR /app

# Download PhoneInfoga binary
RUN wget -O phoneinfoga https://github.com/sundowndev/phoneinfoga/releases/latest/download/phoneinfoga_Linux_x86_64 && \
    chmod +x phoneinfoga

# Switch to non-root user
USER phoneinfoga

# Set entrypoint
ENTRYPOINT ["./phoneinfoga"]

# Default command
CMD ["--help"]
