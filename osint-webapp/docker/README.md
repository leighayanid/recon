# OSINT Tools Docker Containers

This directory contains Dockerfiles for all OSINT tools used in the application.

## Building Images

### Build All Images

```bash
# Build all tool images
docker-compose build

# Or build specific images with profiles
docker-compose --profile tools build
```

### Build Individual Images

```bash
# Sherlock
docker build -t osint-webapp/sherlock:latest ./sherlock

# theHarvester
docker build -t osint-webapp/theharvester:latest ./theharvester

# Holehe
docker build -t osint-webapp/holehe:latest ./holehe

# PhoneInfoga
docker build -t osint-webapp/phoneinfoga:latest ./phoneinfoga
```

## Running Containers

### Start Redis (Required for Job Queue)

```bash
docker-compose up -d redis
```

### Test Individual Tools

```bash
# Sherlock
docker run --rm osint-webapp/sherlock:latest johndoe

# theHarvester
docker run --rm osint-webapp/theharvester:latest -d example.com -b google

# Holehe
docker run --rm osint-webapp/holehe:latest example@email.com

# PhoneInfoga
docker run --rm osint-webapp/phoneinfoga:latest scan -n +1234567890
```

## Security Features

All tool containers implement the following security measures:

- **Non-root user**: Containers run as non-root user (UID 1000)
- **No new privileges**: Prevents privilege escalation
- **Drop all capabilities**: Removes all Linux capabilities
- **Read-only filesystem**: Container filesystem is read-only (except /tmp)
- **Resource limits**: Memory and CPU limits enforced
- **Network isolation**: Containers can be run with `--network=none` for offline tools

## Container Images

| Tool | Image | Size | Purpose |
|------|-------|------|---------|
| Sherlock | `osint-webapp/sherlock:latest` | ~200MB | Username search across social media |
| theHarvester | `osint-webapp/theharvester:latest` | ~180MB | Email and subdomain discovery |
| Holehe | `osint-webapp/holehe:latest` | ~150MB | Email to account finder |
| PhoneInfoga | `osint-webapp/phoneinfoga:latest` | ~20MB | Phone number OSINT |

## Development Workflow

### 1. Start Redis

```bash
docker-compose up -d redis
```

### 2. Build Tool Images

```bash
docker-compose build
```

### 3. Test Tool Execution

```bash
# Test Sherlock
docker run --rm \
  --memory="512m" \
  --cpus="1.0" \
  --network=bridge \
  osint-webapp/sherlock:latest \
  johndoe
```

### 4. Clean Up

```bash
# Stop all containers
docker-compose down

# Remove all images
docker-compose down --rmi all

# Remove all data
docker-compose down -v
```

## Environment Variables

### Redis

- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)

### Tool-Specific Variables

Each tool may support additional environment variables. Check individual Dockerfiles for details.

## Troubleshooting

### Container fails to start

Check logs:
```bash
docker logs osint-sherlock
```

### Permission denied errors

Ensure the container user has access to required directories:
```bash
docker run --rm -it osint-webapp/sherlock:latest /bin/sh
ls -la /app
```

### Network issues

For tools requiring internet access, use bridge network:
```bash
docker run --network=bridge osint-webapp/sherlock:latest johndoe
```

For offline tools, use none network:
```bash
docker run --network=none osint-webapp/exiftool:latest image.jpg
```

## Production Deployment

For production, consider:

1. **Image Registry**: Push images to a container registry (Docker Hub, AWS ECR, etc.)
2. **Image Scanning**: Scan images for vulnerabilities before deployment
3. **Resource Limits**: Set appropriate memory and CPU limits
4. **Monitoring**: Implement container monitoring and logging
5. **Updates**: Regularly update base images and tool versions

## Adding New Tools

To add a new OSINT tool:

1. Create a new directory: `docker/newtool/`
2. Create `Dockerfile` following security best practices
3. Add service to `docker-compose.yml`
4. Update this README
5. Create tool executor in `/lib/tools/newtool/`
6. Register tool in `/lib/tools/registry.ts`
