# Local Setup Guide - OSINT WebApp

## System Analysis Results

✅ **Node.js**: v22.21.1 (Installed and compatible)
✅ **npm**: 10.9.4 (Installed and compatible)
❌ **Docker**: Not installed (REQUIRED)
❌ **Supabase CLI**: Not installed (REQUIRED)

## Prerequisites Installation

### 1. Install Docker

Docker is essential for running:
- Supabase local instance (PostgreSQL, Auth, Storage, APIs)
- Redis (job queue system)
- OSINT tools (Sherlock, theHarvester, Holehe, PhoneInfoga, ExifTool)

**Installation Options:**

#### Linux (Recommended for development):
```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoid using sudo)
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Log out and back in for group changes to take effect
```

#### macOS:
Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

#### Windows:
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**Verify Installation:**
```bash
docker --version
docker compose version
```

### 2. Install Supabase CLI

The Supabase CLI manages your local database, migrations, and development environment.

**Installation Options:**

#### Via npm (Cross-platform):
```bash
npm install -g supabase
```

#### Linux/macOS (Homebrew):
```bash
brew install supabase/tap/supabase
```

#### Linux (Direct download):
```bash
# Download latest release
curl -L https://github.com/supabase/cli/releases/download/v1.123.4/supabase_1.123.4_linux_amd64.tar.gz -o supabase.tar.gz

# Extract and install
tar -xzf supabase.tar.gz
sudo mv supabase /usr/local/bin/
```

**Verify Installation:**
```bash
supabase --version
```

## Step-by-Step Setup Process

### Step 1: Install Node.js Dependencies

Navigate to the project directory and install all required packages:

```bash
cd /home/user/recon/osint-webapp
npm install
```

This will install:
- Next.js 15.1.3 with React 19
- Supabase client libraries
- BullMQ and ioredis (job queue)
- UI libraries (Radix UI, Tailwind CSS)
- Form handling (React Hook Form, Zod)
- All other dependencies listed in package.json

**Expected time**: 2-3 minutes

### Step 2: Create Environment Configuration

Create a `.env.local` file with initial configuration:

```bash
cd /home/user/recon/osint-webapp
cp .env.example .env.local
```

The `.env.example` file contains:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: We'll update the Supabase keys in Step 4.

### Step 3: Start Supabase Local Instance

Start all Supabase services (PostgreSQL, Auth, Storage, APIs):

```bash
cd /home/user/recon/osint-webapp
npm run db:start
# or directly: supabase start
```

This command will:
- Pull Docker images for Supabase services (~1-2 GB)
- Start PostgreSQL database
- Start GoTrue (authentication service)
- Start PostgREST (auto-generated REST API)
- Start Storage API
- Start Realtime server
- Start Supabase Studio (web UI)
- Run database migrations from `supabase/migrations/`

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected time**: 5-10 minutes (first time, due to Docker image downloads)

**Ports used by Supabase:**
- 54321: API Gateway
- 54322: PostgreSQL Database
- 54323: Supabase Studio (Web UI)
- 54324: Inbucket (Email testing)

### Step 4: Update Environment Variables

Copy the `anon key` and `service_role key` from the Supabase output and update `.env.local`:

```bash
# Edit .env.local and update these values:
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
```

### Step 5: Generate TypeScript Types

Generate TypeScript type definitions from your database schema:

```bash
npm run db:types
```

This creates `types/database.types.ts` with type-safe database interfaces.

### Step 6: Start Redis for Job Queue

Start Redis container for the BullMQ job queue system:

```bash
cd /home/user/recon/osint-webapp/docker
docker compose up -d redis
```

This starts Redis on port 6379, used for:
- Background job processing
- Task queue management
- Rate limiting
- Caching

**Verify Redis is running:**
```bash
docker compose ps
```

### Step 7: Build Docker Images for OSINT Tools

Build the Docker images for OSINT tool execution:

```bash
cd /home/user/recon/osint-webapp/docker

# Build all tool images
docker compose build sherlock
docker compose build theharvester
docker compose build holehe
docker compose build phoneinfoga
```

**Note**: These images are used on-demand when executing OSINT searches.

**Expected time**: 10-15 minutes total

### Step 8: Start Next.js Development Server

Start the web application:

```bash
cd /home/user/recon/osint-webapp
npm run dev
```

The development server will start on [http://localhost:3000](http://localhost:3000)

**Features enabled:**
- Hot module replacement (HMR)
- Turbopack bundler (faster than Webpack)
- API routes on `/api/*`
- Server-side rendering (SSR)
- Real-time updates from Supabase

### Step 9: Access the Application

Open your browser and navigate to:

- **Web App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Email Testing**: http://localhost:54324

## Database Schema

The application includes these tables (auto-created by migrations):

- **auth.users** - Supabase authentication users
- **public.profiles** - Extended user profiles
- **public.api_keys** - User API keys for integrations
- **public.investigations** - Investigation workspaces
- **public.jobs** - Background job tracking
- **public.investigation_items** - Job-investigation links
- **public.reports** - Generated reports (PDF/CSV/JSON)
- **public.usage_logs** - Tool usage tracking
- **public.audit_logs** - Security audit trail

All tables include Row Level Security (RLS) policies.

## Services Overview

Once everything is running, you'll have:

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| Next.js App | 3000 | Web application | http://localhost:3000 |
| PostgreSQL | 54322 | Database | postgresql://postgres:postgres@localhost:54322/postgres |
| Supabase API | 54321 | REST/GraphQL API | http://localhost:54321 |
| Supabase Studio | 54323 | Database GUI | http://localhost:54323 |
| Inbucket | 54324 | Email testing | http://localhost:54324 |
| Redis | 6379 | Job queue | redis://localhost:6379 |

## Common Commands

```bash
# Start Supabase
npm run db:start

# Stop Supabase
npm run db:stop

# Reset database (WARNING: deletes all data)
npm run db:reset

# Generate TypeScript types
npm run db:types

# Create new migration
npm run db:migration <migration_name>

# Push migrations to database
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Docker Commands

```bash
# Start Redis only
docker compose up -d redis

# Stop all containers
docker compose down

# View logs
docker compose logs -f

# Build OSINT tool images
docker compose build

# Run Sherlock (example)
docker compose run --rm sherlock sherlock username

# List running containers
docker compose ps
```

## Troubleshooting

### Port Already in Use

If you see errors about ports already in use:

```bash
# Check what's using the port
sudo lsof -i :54321  # or :3000, :6379, etc.

# Stop Supabase and start again
npm run db:stop
npm run db:start
```

### Docker Permission Denied

If you get permission errors with Docker:

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker ps
```

### Supabase Migration Errors

If migrations fail:

```bash
# Reset database
npm run db:reset

# Or manually reset
supabase db reset
```

### Redis Connection Errors

If you can't connect to Redis:

```bash
# Check Redis is running
docker compose ps redis

# Restart Redis
docker compose restart redis

# Check logs
docker compose logs redis
```

### Module Not Found Errors

If you see module import errors:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

## Project Features

Once running, you'll have access to:

1. **Authentication System** - Sign up, login, email verification
2. **Dashboard** - Overview of investigations and recent activity
3. **OSINT Tools**:
   - **Username Search** (Sherlock) - Find accounts across platforms
   - **Domain Investigation** (theHarvester) - Email harvesting, subdomain enumeration
   - **Email Investigation** (Holehe) - Check email across platforms
   - **Phone Lookup** (PhoneInfoga) - Phone number OSINT
   - **Image Metadata** (ExifTool) - Extract EXIF data
4. **Investigation Management** - Organize multiple searches
5. **Job Queue** - Background processing with progress tracking
6. **Report Generation** - Export to PDF, CSV, JSON
7. **Admin Panel** - User management, system monitoring
8. **Real-time Updates** - Live job progress notifications

## Security Notes

- All OSINT tools run in isolated Docker containers
- Input validation via Zod schemas
- Row Level Security (RLS) on all database tables
- Rate limiting per user/tool
- Audit logging for all actions
- Docker containers run with minimal privileges (no-new-privileges, read-only filesystems)

## Next Steps

After setup is complete:

1. Create an account at http://localhost:3000
2. Explore the dashboard and tool interfaces
3. Run a test username search with Sherlock
4. Check Supabase Studio to see data being stored
5. Review the job queue in the dashboard
6. Generate a test report

## Development Workflow

Typical development flow:

1. Make code changes (auto-reloads with HMR)
2. Create database changes:
   ```bash
   npm run db:migration my_changes
   # Edit the migration file
   npm run db:reset  # Apply migrations
   npm run db:types  # Update TypeScript types
   ```
3. Test changes locally
4. Commit and push to GitHub
5. Deploy to production (Vercel + Supabase Cloud)

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **BullMQ Docs**: https://docs.bullmq.io/
- **Radix UI**: https://www.radix-ui.com/
- **Project Plan**: See `PLAN.md` for architecture details
- **Phase Completion**: See `PHASE*_COMPLETE.md` for implementation progress

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: `docker compose logs -f`
3. Review Next.js console output
4. Check Redis connectivity: `docker compose exec redis redis-cli ping`
5. Verify environment variables in `.env.local`

---

**Happy OSINT investigating! 🔍**
