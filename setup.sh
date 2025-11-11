#!/bin/bash

# OSINT WebApp - Quick Start Script
# This script sets up the initial project structure

set -e

echo "🚀 OSINT WebApp Setup"
echo "====================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: brew install supabase/tap/supabase"
    echo "Or: npm install -g supabase"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Project name
PROJECT_NAME="osint-webapp"

# Create Next.js project
echo "📦 Creating Next.js project..."
npx create-next-app@latest $PROJECT_NAME \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --no-src-dir \
  --import-alias "@/*"

cd $PROJECT_NAME

# Initialize Supabase
echo ""
echo "🗄️  Initializing Supabase..."
supabase init

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
# Supabase
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# Job Queue
npm install bullmq@latest ioredis@latest

# Form handling and validation
npm install zod@latest react-hook-form@latest @hookform/resolvers@latest

# UI and utilities
npm install date-fns@latest recharts@latest lucide-react@latest
npm install class-variance-authority@latest clsx@latest tailwind-merge@latest

# Additional utilities
npm install nanoid@latest slugify@latest

# Radix UI primitives for shadcn/ui
npm install @radix-ui/react-dialog@latest @radix-ui/react-dropdown-menu@latest
npm install @radix-ui/react-label@latest @radix-ui/react-select@latest
npm install @radix-ui/react-separator@latest @radix-ui/react-slot@latest
npm install @radix-ui/react-tabs@latest @radix-ui/react-toast@latest
npm install @radix-ui/react-tooltip@latest @radix-ui/react-progress@latest
npm install @radix-ui/react-avatar@latest @radix-ui/react-popover@latest

# Dev dependencies
npm install -D @types/node@latest tailwindcss-animate@latest

# Create directory structure
echo ""
echo "📁 Creating directory structure..."
mkdir -p lib/supabase
mkdir -p lib/tools/base
mkdir -p lib/queue
mkdir -p lib/utils
mkdir -p components/ui
mkdir -p components/auth
mkdir -p components/dashboard
mkdir -p components/tools
mkdir -p components/providers
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/register
mkdir -p app/\(auth\)/callback
mkdir -p app/dashboard
mkdir -p app/tools/username
mkdir -p app/tools/domain
mkdir -p app/tools/email
mkdir -p app/api/tools
mkdir -p app/api/jobs
mkdir -p types
mkdir -p docker/tools

# Create .env.example
echo ""
echo "⚙️  Creating configuration files..."
cat > .env.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For production
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EOF

# Create initial migration
echo ""
echo "🗃️  Creating initial database migration..."
supabase migration new initial_schema

# Create basic lib files
cat > lib/utils/cn.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

cat > lib/supabase/client.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
EOF

cat > lib/supabase/server.ts << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component
          }
        },
      },
    }
  )
}
EOF

# Create README
cat > README.md << 'EOF'
# OSINT WebApp

A comprehensive OSINT (Open Source Intelligence) web application built with Next.js and Supabase.

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- Supabase CLI

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Start Supabase:
```bash
supabase start
```

This will output your local Supabase credentials. Copy the `API URL` and `anon key` to your `.env.local` file.

4. Generate TypeScript types:
```bash
npm run db:types
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Supabase Studio

Access the local database GUI at [http://localhost:54323](http://localhost:54323)

## Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                 # Utility functions and configs
│   ├── supabase/       # Supabase clients
│   ├── tools/          # OSINT tool integrations
│   └── queue/          # Job queue system
├── supabase/           # Supabase config and migrations
├── types/              # TypeScript types
└── docker/             # Docker configurations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:types` - Generate TypeScript types from Supabase
- `npm run db:reset` - Reset local database

## Documentation

See the `docs/` directory for detailed documentation.
EOF

# Add scripts to package.json
echo ""
echo "📝 Adding npm scripts..."
npm pkg set scripts.db:types="supabase gen types typescript --local > types/database.types.ts"
npm pkg set scripts.db:reset="supabase db reset"
npm pkg set scripts.db:start="supabase start"
npm pkg set scripts.db:stop="supabase stop"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. supabase start"
echo "3. Copy the credentials to .env.local"
echo "4. npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Supabase Studio: http://localhost:54323"
echo "- App: http://localhost:3000"
echo ""
echo "Happy coding! 🎉"
