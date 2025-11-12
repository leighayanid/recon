# OSINT WebApp

A comprehensive OSINT (Open Source Intelligence) web application built with Next.js 15 and Supabase.

## Overview

This platform integrates multiple CLI-based OSINT tools into a unified browser-accessible interface, providing capabilities for:

- **Username Investigation**: Sherlock, Maigret, WhatsMyName
- **Domain & Network Analysis**: theHarvester, Sublist3r, Amass, DNSRecon, Nmap
- **Email Investigation**: Holehe, h8mail, Hunter.io
- **Phone Number Lookup**: PhoneInfoga
- **Image Metadata**: ExifTool
- **Social Media Analysis**: Various platforms

## Technology Stack

- **Frontend**: Next.js 15.1.3 (App Router with Turbopack) + React 19
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Job Queue**: BullMQ + Redis
- **UI**: Tailwind CSS + Radix UI
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel (frontend) + Railway/Fly.io (tool execution)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Supabase CLI** - Install with:
  ```bash
  npm install -g supabase
  # or
  brew install supabase/tap/supabase
  ```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Supabase

Start the local Supabase instance (PostgreSQL, Auth, Storage, etc.):

```bash
npm run db:start
```

This will output your local credentials:
- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323 (Database GUI)
- **Anon Key**: eyJ... (public key)
- **Service Role Key**: eyJ... (admin key)

### 3. Update Environment Variables

Copy the credentials from the previous step to your `.env.local` file:

```bash
# Update these values in .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 4. Generate TypeScript Types

Generate TypeScript types from your database schema:

```bash
npm run db:types
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
osint-webapp/
├── app/                    # Next.js app directory (routes)
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main dashboard
│   ├── tools/             # OSINT tool interfaces
│   ├── investigations/    # Investigation management
│   ├── reports/           # Report generation
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── tools/            # Tool-specific components
├── lib/                   # Utility functions and configs
│   ├── supabase/         # Supabase clients (browser/server)
│   ├── tools/            # OSINT tool integrations
│   ├── queue/            # Job queue system (BullMQ)
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
│   └── database.types.ts # Generated from Supabase
├── supabase/             # Supabase configuration
│   ├── config.toml       # Supabase CLI config
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge Functions
│   └── seed.sql          # Seed data
└── docker/               # Docker configurations for tools
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:start` - Start local Supabase
- `npm run db:stop` - Stop local Supabase
- `npm run db:reset` - Reset database (WARNING: deletes data)
- `npm run db:types` - Generate TypeScript types from database
- `npm run db:migration` - Create new migration file
- `npm run db:push` - Push migrations to database

## Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **profiles** - User profiles (extends Supabase Auth)
- **api_keys** - User API keys for tool integrations
- **investigations** - Investigation workspaces
- **jobs** - Background job tracking
- **investigation_items** - Links between jobs and investigations
- **reports** - Generated reports (PDF, CSV, JSON)
- **usage_logs** - Tool usage tracking
- **audit_logs** - Security audit trail

All tables include Row Level Security (RLS) policies for data protection.

## Key Features

### 15 Core Modules

1. Authentication & User Management
2. Dashboard & Overview
3. Tool Integration Framework
4. Username Investigation Tools
5. Domain & Network Investigation
6. Email Investigation
7. Phone Number Investigation
8. Image & Metadata Analysis
9. Social Media Analysis
10. Job Queue & Task Management
11. Report Generation & Export
12. Investigation Management
13. Admin Panel
14. API Rate Limiting & Usage Tracking
15. Real-time Notifications

## Development Tools

### Supabase Studio

Access the local database GUI at [http://localhost:54323](http://localhost:54323)

Features:
- Browse tables and data
- Run SQL queries
- Manage authentication
- Configure storage buckets
- View real-time logs

### Inbucket (Email Testing)

View test emails at [http://localhost:54324](http://localhost:54324)

## Security

- **Row Level Security (RLS)** - Database-level access control
- **Docker Sandboxing** - Isolated tool execution
- **Input Validation** - Zod schema validation
- **Rate Limiting** - Per-user/tool quotas
- **Audit Logging** - Complete activity tracking
- **HTTPS/HSTS** - Secure transport layer

## Deployment

### Frontend (Vercel)

```bash
vercel deploy
```

### Database (Supabase Cloud)

1. Create project at [supabase.com](https://supabase.com)
2. Link local project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push migrations:
   ```bash
   supabase db push --remote
   ```
4. Update production `.env` variables

## Contributing

See [PLAN.md](../PLAN.md) and [AGENT.md](../AGENT.md) for detailed architecture and implementation guidelines.

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.

---

**Note**: This project requires proper authorization for OSINT operations. Always ensure compliance with local laws and terms of service of investigated platforms.
