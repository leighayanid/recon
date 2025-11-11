# OSINT Web Application - Supabase Implementation Guide

## Updated Architecture with Supabase

### Technology Stack
- **Frontend**: Next.js 15.1.3 (App Router with Turbopack)
- **React**: React 19.0.0 (latest)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
  - @supabase/supabase-js: ^2.47.10
  - @supabase/ssr: ^0.5.2
- **Local Development**: Supabase CLI
- **Job Queue**: BullMQ 5.28.3 with Redis (self-hosted or Upstash)
- **Tool Execution**: Docker containers
- **Form & Validation**: 
  - Zod ^3.24.1
  - React Hook Form ^7.54.2
- **UI Components**: Radix UI primitives (latest)
- **Styling**: Tailwind CSS 3.4.17
- **Deployment**: Vercel (Frontend) + Railway/Fly.io (Tool execution service)

---

## Supabase Services Used

### 1. **Supabase Auth**
- Email/Password authentication
- OAuth providers (Google, GitHub)
- Row Level Security (RLS) for data protection
- JWT tokens for API authentication

### 2. **Supabase Database (PostgreSQL)**
- Store all application data
- Real-time subscriptions for job updates
- Full-text search capabilities
- JSON/JSONB support for flexible data

### 3. **Supabase Storage**
- Store uploaded images for analysis
- Store generated reports (PDF, CSV, JSON)
- Store investigation exports
- Public and private buckets

### 4. **Supabase Realtime**
- Live job status updates
- Real-time notifications
- Investigation collaboration features

### 5. **Supabase Edge Functions** (Optional)
- Webhook handlers
- Background processing triggers
- Custom API endpoints

---

## Project Structure (Updated for Supabase)

```
osint-webapp/
├── supabase/
│   ├── config.toml                 # Supabase CLI config
│   ├── seed.sql                    # Seed data for development
│   ├── migrations/                 # Database migrations
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_add_rls_policies.sql
│   │   ├── 20240103000000_create_functions.sql
│   │   └── 20240104000000_create_indexes.sql
│   └── functions/                  # Edge Functions (optional)
│       ├── job-webhook/
│       └── report-generator/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── callback/page.tsx      # OAuth callback
│   │   └── reset-password/page.tsx
│   ├── dashboard/
│   ├── tools/
│   ├── investigations/
│   ├── reports/
│   ├── api/
│   │   ├── tools/
│   │   ├── jobs/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── providers/
│   │   └── SupabaseProvider.tsx
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   ├── middleware.ts          # Auth middleware
│   │   └── types.ts               # Generated types
│   ├── tools/
│   ├── queue/
│   └── utils/
├── types/
│   └── database.types.ts          # Generated from Supabase
├── .env.local
├── .env.example
├── next.config.js
├── package.json
└── README.md
```

---

## Local Development Setup

### Prerequisites
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase

# Install Docker Desktop (required for Supabase local)
# Download from: https://www.docker.com/products/docker-desktop
```

### Initial Setup Steps

#### 1. Initialize Supabase
```bash
# Create project directory
mkdir osint-webapp
cd osint-webapp

# Initialize Next.js 15 with Turbopack
npx create-next-app@latest . --typescript --tailwind --app --turbopack --no-src-dir

# Initialize Supabase
supabase init

# This creates the supabase/ directory with config.toml
```

#### 2. Start Supabase Locally
```bash
# Start all Supabase services locally (PostgreSQL, Auth, Storage, etc.)
supabase start

# This will output:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323 (Database GUI)
# - Anon Key: eyJ... (public key for client)
# - Service Role Key: eyJ... (admin key for server)
```

#### 3. Install Dependencies
```bash
# Supabase (latest versions)
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# Job Queue
npm install bullmq@latest ioredis@latest

# Form handling and validation
npm install zod@latest react-hook-form@latest @hookform/resolvers@latest

# UI and utilities
npm install date-fns@latest recharts@latest lucide-react@latest
npm install class-variance-authority@latest clsx@latest tailwind-merge@latest
npm install nanoid@latest slugify@latest

# Radix UI primitives for shadcn/ui (latest)
npm install @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest
npm install @radix-ui/react-label@latest @radix-ui/react-select@latest
npm install @radix-ui/react-separator@latest @radix-ui/react-slot@latest
npm install @radix-ui/react-tabs@latest @radix-ui/react-toast@latest
npm install @radix-ui/react-tooltip@latest @radix-ui/react-progress@latest
npm install @radix-ui/react-avatar@latest @radix-ui/react-popover@latest

# Dev dependencies
npm install -D @types/node@latest tailwindcss-animate@latest
```

#### 4. Environment Variables
Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# Optional: For production
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

---

## Database Schema (Supabase Migrations)

### Migration 1: Initial Schema
Create: `supabase/migrations/20240101000000_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys
CREATE TABLE public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investigations
CREATE TABLE public.investigations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  investigation_id UUID REFERENCES public.investigations(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  input_data JSONB NOT NULL,
  output_data JSONB,
  error_message TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investigation Items (linking jobs to investigations)
CREATE TABLE public.investigation_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  investigation_id UUID REFERENCES public.investigations(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(investigation_id, job_id)
);

-- Reports
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  investigation_id UUID REFERENCES public.investigations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT DEFAULT 'standard' CHECK (report_type IN ('standard', 'detailed', 'summary')),
  report_data JSONB NOT NULL,
  file_path TEXT, -- Path in Supabase Storage
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Logs
CREATE TABLE public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool_name TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_tool_name ON public.jobs(tool_name);
CREATE INDEX idx_investigations_user_id ON public.investigations(user_id);
CREATE INDEX idx_investigations_status ON public.investigations(status);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_investigations_name_search ON public.investigations USING gin(name gin_trgm_ops);
CREATE INDEX idx_investigations_description_search ON public.investigations USING gin(description gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investigations_updated_at BEFORE UPDATE ON public.investigations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Migration 2: Row Level Security (RLS)
Create: `supabase/migrations/20240102000000_add_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Investigations policies
CREATE POLICY "Users can view own investigations" ON public.investigations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investigations" ON public.investigations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investigations" ON public.investigations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investigations" ON public.investigations
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Investigation Items policies
CREATE POLICY "Users can view own investigation items" ON public.investigation_items
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can create own investigation items" ON public.investigation_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can update own investigation items" ON public.investigation_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

CREATE POLICY "Users can delete own investigation items" ON public.investigation_items
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.investigations WHERE id = investigation_id
    )
  );

-- Reports policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Logs policies (read-only for users, write via service role)
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs policies (admin only, or via service role)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);
```

### Migration 3: Database Functions
Create: `supabase/migrations/20240103000000_create_functions.sql`

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_investigations', (SELECT COUNT(*) FROM public.investigations WHERE user_id = user_uuid),
    'total_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid),
    'completed_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid AND status = 'completed'),
    'failed_jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = user_uuid AND status = 'failed'),
    'total_reports', (SELECT COUNT(*) FROM public.reports WHERE user_id = user_uuid),
    'tools_usage', (
      SELECT json_object_agg(tool_name, count)
      FROM (
        SELECT tool_name, COUNT(*) as count
        FROM public.jobs
        WHERE user_id = user_uuid
        GROUP BY tool_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search investigations
CREATE OR REPLACE FUNCTION public.search_investigations(
  user_uuid UUID,
  search_query TEXT,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  status TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.description,
    i.status,
    i.tags,
    i.created_at,
    GREATEST(
      similarity(i.name, search_query),
      similarity(COALESCE(i.description, ''), search_query)
    ) as similarity
  FROM public.investigations i
  WHERE i.user_id = user_uuid
    AND (
      i.name ILIKE '%' || search_query || '%'
      OR i.description ILIKE '%' || search_query || '%'
      OR search_query = ANY(i.tags)
    )
  ORDER BY similarity DESC, i.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Package.json Reference

Here's the complete `package.json` with all latest versions:

```json
{
  "name": "osint-webapp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:types": "supabase gen types typescript --local > types/database.types.ts",
    "db:reset": "supabase db reset",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migration": "supabase migration new",
    "db:push": "supabase db push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.5",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.10",
    "bullmq": "^5.28.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "ioredis": "^5.4.2",
    "lucide-react": "^0.468.0",
    "nanoid": "^5.0.9",
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.0",
    "slugify": "^1.6.6",
    "tailwind-merge": "^2.5.5",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.1.3",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=18.18.0"
  }
}
```

---

## Next.js 15 Configuration

Create: `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Turbopack for faster builds
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Server actions configuration
  serverActions: {
    bodySizeLimit: '2mb',
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

---

## Supabase Client Setup

### Browser Client
Create: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Create a singleton client for client-side
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

// Alias for convenience
export const supabase = createClient()
```

### Server Client (for Server Components and API Routes)
Create: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client with service role key (use with caution)
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
    }
  )
}
```

### Middleware (for Auth)
Create: `lib/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/tools') ||
                          request.nextUrl.pathname.startsWith('/investigations') ||
                          request.nextUrl.pathname.startsWith('/reports') ||
                          request.nextUrl.pathname.startsWith('/admin')

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

Create: `middleware.ts` (root)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Storage Buckets Setup

### Create Buckets via Supabase Studio or SQL

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('reports', 'reports', false),
  ('uploads', 'uploads', false),
  ('avatars', 'avatars', true);

-- Storage policies for reports bucket
CREATE POLICY "Users can upload own reports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own reports" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Real-time Subscriptions Example

### Subscribe to Job Updates
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Job = Database['public']['Tables']['jobs']['Row']

export function useJobUpdates(userId: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial jobs
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (data) setJobs(data)
    }

    fetchJobs()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('job_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Job, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === payload.new.id ? (payload.new as Job) : job
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return jobs
}
```

---

## Common Supabase CLI Commands

```bash
# Start Supabase locally
supabase start

# Stop Supabase
supabase stop

# Reset database (WARNING: deletes all data)
supabase db reset

# Create a new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --local > types/database.types.ts

# View database in browser
# Open http://localhost:54323

# Check Supabase status
supabase status

# Link to remote project
supabase link --project-ref your-project-ref

# Pull remote schema to local
supabase db pull

# Push local migrations to remote
supabase db push --remote
```

---

## Development Workflow

### Important Notes for Next.js 15 & React 19
- **Async Request APIs**: In Next.js 15, `cookies()`, `headers()`, and `params` are now async and must be awaited
- **Turbopack**: Next.js 15 uses Turbopack by default for faster development builds
- **React 19**: Latest React version with improved server components and actions
- **Stricter TypeScript**: Enhanced type checking for better development experience

### 1. **Daily Development**
```bash
# Start Supabase
supabase start

# Start Next.js dev server with Turbopack
npm run dev

# Or explicitly with turbo
npm run dev --turbo

# Open Supabase Studio
open http://localhost:54323
```

### 2. **Making Database Changes**
```bash
# Create new migration
supabase migration new add_new_feature

# Edit the migration file in supabase/migrations/

# Apply migration
supabase db reset  # This runs all migrations

# Generate new types
supabase gen types typescript --local > types/database.types.ts
```

### 3. **Testing**
```bash
# Reset database with seed data
supabase db reset

# The seed.sql file runs automatically
```

### 4. **Deployment**
```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push --remote

# Deploy Next.js to Vercel
vercel deploy
```

---

## Seed Data
Create: `supabase/seed.sql`

```sql
-- Seed data for development

-- Insert test user profile (requires user to exist in auth.users first)
-- You'll need to sign up through the app first, then add this data

-- Insert sample investigation
INSERT INTO public.investigations (user_id, name, description, tags)
VALUES
  (
    'user-uuid-here',
    'Sample Investigation',
    'This is a sample investigation for testing',
    ARRAY['test', 'sample']
  );

-- Insert sample job
INSERT INTO public.jobs (user_id, tool_name, status, input_data, progress)
VALUES
  (
    'user-uuid-here',
    'sherlock',
    'completed',
    '{"username": "testuser"}'::jsonb,
    100
  );
```

---

## Next Steps

1. **Set up project structure**: Initialize Next.js and Supabase
2. **Run initial migration**: Create database schema
3. **Configure authentication**: Set up login/register pages
4. **Build first tool integration**: Start with Sherlock
5. **Implement job queue**: Set up BullMQ with Redis
6. **Create dashboard**: Build main user interface

Ready to start coding? I can help you with any specific component!