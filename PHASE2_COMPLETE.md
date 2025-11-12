# Phase 2: Core Infrastructure - COMPLETE ✅

## Overview

Phase 2 implementation is complete! This phase establishes the core infrastructure for the OSINT Web Application, including job queue management, tool execution framework, Docker containerization, API endpoints, and comprehensive error handling.

## Completed Components

### 1. Job Queue System (BullMQ + Redis) ✅

**Location**: `/lib/queue/`

- **`types.ts`**: Type definitions for jobs, workers, and queue events
- **`connection.ts`**: Redis connection management with retry logic
- **`jobQueue.ts`**: BullMQ queue setup with job management functions
- **`workers/toolWorker.ts`**: Worker for processing OSINT tool jobs

**Features**:
- Asynchronous job processing with BullMQ
- Redis-based queue with persistence
- Job prioritization and retry logic
- Progress tracking and real-time updates
- Automatic cleanup of old jobs
- Error handling and logging

**API**:
```typescript
// Add job to queue
await addJob(toolName, inputData, userId, investigationId, options);

// Get job status
const status = await getJobStatus(jobId);

// Retry failed job
await retryJob(jobId);

// Get queue metrics
const metrics = await getQueueMetrics();
```

### 2. Tool Execution Framework ✅

**Location**: `/lib/tools/`

**Base Classes**:
- **`base/ToolExecutor.ts`**: Abstract base class for all tool executors
- **`base/DockerExecutor.ts`**: Docker-based executor with security features

**Features**:
- Abstract executor pattern for easy tool integration
- Input validation with Zod schemas
- Progress reporting callbacks
- Timeout management
- Docker container sandboxing
- Security features:
  - Non-root execution
  - Resource limits (memory, CPU)
  - Network isolation options
  - Read-only filesystems
  - No privilege escalation

**Example Tool**:
- **`sherlock/SherlockExecutor.ts`**: Complete implementation of Sherlock username search
- **`validators/sherlockValidator.ts`**: Zod validation schemas

### 3. Tool Registry ✅

**Location**: `/lib/tools/registry.ts`

**Features**:
- Central registry for all OSINT tools
- Tool metadata management
- Category-based tool filtering
- Dynamic tool registration
- Tool availability checking

**API**:
```typescript
// Get tool executor
const executor = getToolExecutor('sherlock');

// Get all tools
const tools = getAllTools();

// Get tools by category
const usernameTools = getToolsByCategory('username');

// Get metadata
const metadata = getAllToolsMetadata();
```

### 4. Input Validation System ✅

**Location**: `/lib/utils/validation.ts`

**Features**:
- Common validation schemas (username, email, domain, phone, URL, IP)
- Input sanitization functions
- SQL injection prevention
- Command injection prevention
- Helper validation functions

**Schemas**:
- `usernameSchema`: Alphanumeric + underscore/hyphen
- `emailSchema`: RFC-compliant email validation
- `domainSchema`: Domain name validation
- `phoneSchema`: International phone format
- `urlSchema`: URL validation
- `ipv4Schema`: IPv4 address validation
- `uuidSchema`: UUID validation

### 5. Error Handling & Logging ✅

**Location**: `/lib/utils/`

**Error Classes** (`errors.ts`):
- `AppError`: Base application error
- `ValidationError`: Input validation errors (400)
- `AuthenticationError`: Auth required (401)
- `AuthorizationError`: Insufficient permissions (403)
- `NotFoundError`: Resource not found (404)
- `RateLimitError`: Rate limit exceeded (429)
- `ToolExecutionError`: Tool execution failures (500)
- `DatabaseError`: Database operation errors (500)

**Logger** (`logger.ts`):
- Structured logging with levels (debug, info, warn, error)
- Context-aware logging
- Environment-based output (console in dev, service in prod)
- Child logger support

### 6. API Rate Limiting ✅

**Location**: `/lib/middleware/rateLimit.ts`

**Features**:
- Redis-based rate limiting
- Role-based limits (free, pro, admin)
- Per-user and per-IP limiting
- Sliding window algorithm
- Rate limit headers in responses
- Configurable limits per tool

**Rate Limits**:
- **Free**: 100 requests/hour, 10 tools/hour
- **Pro**: 1000 requests/hour, 100 tools/hour
- **Admin**: 10000 requests/hour, 1000 tools/hour

### 7. Docker Containers ✅

**Location**: `/docker/`

**Tool Images**:
- **Sherlock**: Username search across social media
- **theHarvester**: Email and subdomain discovery
- **Holehe**: Email to account finder
- **PhoneInfoga**: Phone number OSINT

**Security Features**:
- Non-root user execution (UID 1000)
- No new privileges flag
- All capabilities dropped
- Read-only filesystem (except /tmp)
- Memory and CPU limits
- Network isolation support

**Docker Compose**:
- Redis service for job queue
- All tool services with security constraints
- Named volumes for data persistence
- Health checks

### 8. API Routes ✅

**Location**: `/app/api/`

**Endpoints**:

#### Jobs API
- `POST /api/jobs`: Create new job
- `GET /api/jobs`: List user's jobs (with filters)
- `GET /api/jobs/[id]`: Get job status
- `DELETE /api/jobs/[id]`: Cancel job
- `POST /api/jobs/[id]/retry`: Retry failed job

#### Tools API
- `GET /api/tools`: List available tools and metadata

**Features**:
- Authentication required for all endpoints
- Rate limiting with headers
- Input validation
- Pagination support
- Comprehensive error handling
- Audit logging

## File Structure

```
osint-webapp/
├── lib/
│   ├── queue/
│   │   ├── types.ts
│   │   ├── connection.ts
│   │   ├── jobQueue.ts
│   │   └── workers/
│   │       └── toolWorker.ts
│   ├── tools/
│   │   ├── base/
│   │   │   ├── ToolExecutor.ts
│   │   │   └── DockerExecutor.ts
│   │   ├── sherlock/
│   │   │   └── SherlockExecutor.ts
│   │   ├── validators/
│   │   │   └── sherlockValidator.ts
│   │   └── registry.ts
│   ├── middleware/
│   │   └── rateLimit.ts
│   └── utils/
│       ├── validation.ts
│       ├── errors.ts
│       └── logger.ts
├── app/
│   └── api/
│       ├── jobs/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── retry/
│       │           └── route.ts
│       └── tools/
│           └── route.ts
└── docker/
    ├── sherlock/
    │   └── Dockerfile
    ├── theharvester/
    │   └── Dockerfile
    ├── holehe/
    │   └── Dockerfile
    ├── phoneinfoga/
    │   └── Dockerfile
    ├── docker-compose.yml
    └── README.md
```

## Getting Started

### Prerequisites

1. **Docker Desktop**: Required for tool execution
2. **Redis**: Required for job queue
3. **Node.js 18+**: For the application

### Setup

1. **Start Redis**:
```bash
cd osint-webapp/docker
docker-compose up -d redis
```

2. **Build Docker Images** (optional, will be pulled on first use):
```bash
docker-compose build
```

3. **Install Dependencies**:
```bash
cd osint-webapp
npm install
```

4. **Environment Variables**:
Ensure `.env.local` contains:
```bash
REDIS_URL=redis://localhost:6379
```

5. **Start Development Server**:
```bash
npm run dev
```

### Testing the Implementation

#### 1. Start the Worker

Create a simple script to start the worker:

```typescript
// scripts/start-worker.ts
import { startWorker } from '@/lib/queue/workers/toolWorker';

console.log('Starting OSINT tool worker...');
startWorker({
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

console.log('Worker started successfully');
```

Run with:
```bash
npx tsx scripts/start-worker.ts
```

#### 2. Create a Test Job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "toolName": "sherlock",
    "inputData": {
      "username": "johndoe"
    }
  }'
```

#### 3. Check Job Status

```bash
curl http://localhost:3000/api/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. List All Jobs

```bash
curl http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Examples

### Create Job

```typescript
// Request
POST /api/jobs
{
  "toolName": "sherlock",
  "inputData": {
    "username": "johndoe",
    "timeout": 60
  },
  "investigationId": "uuid-here",
  "priority": 5
}

// Response
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "toolName": "sherlock",
    "status": "pending",
    "progress": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get Job Status

```typescript
// Request
GET /api/jobs/job-uuid

// Response
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "user_id": "user-uuid",
    "tool_name": "sherlock",
    "status": "running",
    "progress": 45,
    "input_data": {...},
    "output_data": null,
    "created_at": "2024-01-01T00:00:00Z",
    "started_at": "2024-01-01T00:00:10Z",
    "queueStatus": {
      "state": "active",
      "progress": 45
    }
  }
}
```

### List Jobs

```typescript
// Request
GET /api/jobs?status=completed&limit=20&offset=0

// Response
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00Z",
    "errors": ["Field error 1", "Field error 2"] // For validation errors
  }
}
```

## Rate Limiting

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Security Features

1. **Input Validation**: All inputs validated with Zod schemas
2. **Sanitization**: SQL/Command injection prevention
3. **Authentication**: All endpoints require authentication
4. **Authorization**: Users can only access their own resources
5. **Rate Limiting**: Prevent abuse
6. **Docker Isolation**: Tools run in isolated containers
7. **Resource Limits**: Memory and CPU caps on containers
8. **Audit Logging**: All actions logged to database
9. **Error Handling**: Secure error messages (no stack traces in prod)

## Next Steps (Phase 3)

1. ✅ **Complete First Tool Integration**: Sherlock is implemented
2. ⏳ **Add More Tools**: theHarvester, Holehe, PhoneInfoga, etc.
3. ⏳ **Build Tool UIs**: Frontend components for each tool
4. ⏳ **Implement Result Parsing**: Custom parsers for each tool
5. ⏳ **Add Export Functionality**: JSON, CSV, PDF exports
6. ⏳ **Real-time Updates**: WebSocket/SSE for live progress

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis connection
redis-cli ping

# View Redis logs
docker logs osint-redis
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# Rebuild images
docker-compose build --no-cache

# View container logs
docker logs osint-sherlock
```

### Worker Issues

```bash
# Check worker is running
ps aux | grep node

# View worker logs
# (logs will appear in terminal where worker is running)
```

## Performance Considerations

1. **Concurrency**: Worker concurrency set to 5 (adjustable)
2. **Rate Limiting**: 10 jobs per second max
3. **Memory**: Each container limited to 512MB
4. **CPU**: Each container limited to 1 CPU
5. **Job Retention**: Completed jobs kept for 24 hours, failed for 7 days

## Monitoring

- Job queue metrics available via `getQueueMetrics()`
- All errors logged to console/logging service
- Audit logs stored in database
- Usage tracking in `usage_logs` table

## Contributing

To add a new OSINT tool:

1. Create Dockerfile in `/docker/newtool/`
2. Create executor in `/lib/tools/newtool/`
3. Create validator in `/lib/tools/validators/`
4. Register in `/lib/tools/registry.ts`
5. Update `ToolName` type in `/lib/queue/types.ts`
6. Test thoroughly

---

## Summary

Phase 2 is **100% complete** with all core infrastructure in place:

✅ Job Queue System
✅ Tool Execution Framework
✅ Tool Registry
✅ Input Validation
✅ Error Handling
✅ Logging
✅ Rate Limiting
✅ Docker Containers
✅ API Routes

The application is now ready for Phase 3: Additional tool integrations and UI development!
