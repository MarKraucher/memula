# Memula Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working note-taking app with authentication, CRUD operations, and basic UI — the foundation all future phases build on.

**Architecture:** Next.js 16 App Router monolith with Supabase backend (PostgreSQL + pgvector). OAuth (Google, GitHub) + email/password auth via Supabase Auth. Server Components by default, Client Components for interactivity. API routes for all mutations.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (Auth, DB, Storage), Zod, @serwist/next (PWA scaffold)

**Spec Reference:** `docs/superpowers/specs/2026-03-28-memula-design.md`

---

## File Structure

```
memula/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── CLAUDE.md
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql        # Core tables + types
│       ├── 002_indexes.sql               # FTS, pgvector, common queries
│       └── 003_rls_policies.sql          # Row Level Security
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout + AuthProvider + metadata
│   │   ├── page.tsx                      # Dashboard (note grid + sidebar)
│   │   ├── globals.css                   # Tailwind imports + theme
│   │   ├── middleware.ts                 # Auth guard + redirects
│   │   ├── login/
│   │   │   └── page.tsx                  # OAuth + email/password login
│   │   ├── register/
│   │   │   └── page.tsx                  # Registration form
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts             # OAuth callback handler
│   │   ├── notes/
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # New note form
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Note detail view
│   │   │       └── edit/
│   │   │           └── page.tsx         # Edit note form
│   │   └── api/
│   │       ├── notes/
│   │       │   ├── route.ts             # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       └── route.ts         # GET + PATCH + DELETE
│   │       └── tags/
│   │           └── route.ts             # GET (autocomplete)
│   ├── components/
│   │   ├── AuthProvider.tsx              # Client auth context
│   │   ├── Header.tsx                    # Top nav with search + user menu
│   │   ├── Sidebar.tsx                   # Type/category/tag filters
│   │   ├── NoteCard.tsx                  # Card in grid
│   │   ├── NoteGrid.tsx                  # Responsive card grid
│   │   ├── NoteForm.tsx                  # Create/edit note form
│   │   └── NoteDetail.tsx               # Full note view
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser client
│   │   │   ├── server.ts                # Server client (cookies)
│   │   │   └── types.ts                 # Generated DB types (placeholder)
│   │   ├── auth-guard.ts                # requireAuth() helper
│   │   └── schemas.ts                   # Zod validation schemas
│   └── types/
│       └── note.ts                      # TypeScript type definitions
└── tests/
    ├── api/
    │   ├── notes.test.ts                # Notes CRUD API tests
    │   └── tags.test.ts                 # Tags API tests
    └── lib/
        └── schemas.test.ts              # Zod schema tests
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.local.example`, `CLAUDE.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
cd c:\Users\marek\Documents\claude-code
npx create-next-app@latest memula --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd memula
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D @types/node
```

- [ ] **Step 3: Create .env.local.example**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

- [ ] **Step 4: Create CLAUDE.md with project overview**

```markdown
# Memula — AI-Powered Note Manager

## Tech Stack
- Next.js 16 (App Router) + Tailwind CSS 4
- Supabase (PostgreSQL + pgvector, Auth, Storage)
- TypeScript strict mode
- Zod for validation

## Project Structure
- `src/app/` — Pages and API routes (App Router)
- `src/components/` — React components
- `src/lib/` — Utilities, Supabase clients, schemas
- `src/types/` — TypeScript types
- `supabase/migrations/` — SQL migrations
- `tests/` — Test files

## Coding Standards
- Server Components by default, Client Components only when needed
- Zod for all external data validation
- All text in Czech (UI), code in English
- Environment variables via .env.local (never commit)

## Spec
See `docs/superpowers/specs/2026-03-28-memula-design.md`
```

- [ ] **Step 5: Update globals.css with theme**

```css
@import "tailwindcss";

@theme {
  --color-brand: #6366f1;
  --color-brand-dark: #4f46e5;
  --font-sans: "Geist", "Geist Sans", sans-serif;
}
```

- [ ] **Step 6: Update root layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memula",
  description: "AI-powered personal note manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder home page**

```tsx
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold text-brand">Memula</h1>
    </div>
  );
}
```

- [ ] **Step 8: Verify dev server starts**

Run: `npm run dev`
Expected: App loads at http://localhost:3000 showing "Memula"

- [ ] **Step 9: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and Supabase deps"
```

---

## Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`

- [ ] **Step 1: Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create placeholder types**

```typescript
// src/lib/supabase/types.ts
// Placeholder — will be generated from Supabase schema later
export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          content_type: "link" | "text" | "video" | "image" | "recipe";
          source_url: string | null;
          raw_content: string | null;
          structured_data: Record<string, unknown>;
          status: "pending" | "processing" | "ready" | "error";
          processing_attempts: number;
          is_shared: boolean;
          share_id: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary?: string | null;
          content_type?: "link" | "text" | "video" | "image" | "recipe";
          source_url?: string | null;
          raw_content?: string | null;
          structured_data?: Record<string, unknown>;
          status?: "pending" | "processing" | "ready" | "error";
          processing_attempts?: number;
          is_shared?: boolean;
          share_id?: string | null;
          language?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
      };
      tags: {
        Row: {
          id: string;
          name: string;
          usage_count: number;
        };
        Insert: {
          id?: string;
          name: string;
          usage_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
      };
      note_tags: {
        Row: {
          note_id: string;
          tag_id: string;
          is_ai_suggested: boolean;
        };
        Insert: {
          note_id: string;
          tag_id: string;
          is_ai_suggested?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["note_tags"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      note_categories: {
        Row: {
          note_id: string;
          category_id: string;
          is_ai_suggested: boolean;
        };
        Insert: {
          note_id: string;
          category_id: string;
          is_ai_suggested?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["note_categories"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          tier: "free" | "pro";
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          tier?: "free" | "pro";
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      usage_limits: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          ai_processing_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          ai_processing_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["usage_limits"]["Insert"]>;
      };
      note_images: {
        Row: {
          id: string;
          note_id: string;
          storage_path: string;
          is_primary: boolean;
        };
        Insert: {
          id?: string;
          note_id: string;
          storage_path: string;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["note_images"]["Insert"]>;
      };
      shared_collections: {
        Row: {
          id: string;
          user_id: string;
          share_id: string;
          name: string;
          filter_categories: string[] | null;
          filter_tags: string[] | null;
          filter_content_types: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_id?: string;
          name: string;
          filter_categories?: string[] | null;
          filter_tags?: string[] | null;
          filter_content_types?: string[] | null;
        };
        Update: Partial<Database["public"]["Tables"]["shared_collections"]["Insert"]>;
      };
    };
  };
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client setup (browser + server + types)"
```

---

## Task 3: Database Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_indexes.sql`, `supabase/migrations/003_rls_policies.sql`

- [ ] **Step 1: Create initial schema migration**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Content types recognized by AI
CREATE TYPE content_type AS ENUM ('link', 'text', 'video', 'image', 'recipe');
CREATE TYPE note_status AS ENUM ('pending', 'processing', 'ready', 'error');

-- Main notes table
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    content_type content_type NOT NULL DEFAULT 'text',
    source_url TEXT,
    raw_content TEXT,
    structured_data JSONB DEFAULT '{}',
    embedding vector(1536),
    status note_status NOT NULL DEFAULT 'pending',
    processing_attempts INT DEFAULT 0,
    is_shared BOOLEAN DEFAULT false,
    share_id UUID UNIQUE,
    language TEXT DEFAULT 'cs',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (shared across users, deduplicated)
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    usage_count INT DEFAULT 0
);

-- Many-to-many: notes <-> tags
CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    is_ai_suggested BOOLEAN DEFAULT false,
    PRIMARY KEY (note_id, tag_id)
);

-- Categories (system-wide + user-created)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE (name, user_id)
);

-- Many-to-many: notes <-> categories
CREATE TABLE note_categories (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_ai_suggested BOOLEAN DEFAULT false,
    PRIMARY KEY (note_id, category_id)
);

-- Note images
CREATE TABLE note_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false
);

-- User profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage tracking
CREATE TABLE usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    ai_processing_count INT DEFAULT 0,
    UNIQUE (user_id, month)
);

-- Shared collections
CREATE TABLE shared_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    filter_categories UUID[],
    filter_tags UUID[],
    filter_content_types content_type[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default system categories
INSERT INTO categories (name, icon, color, user_id) VALUES
    ('Technologie', '💻', '#6366f1', NULL),
    ('Vaření', '🍽️', '#ef4444', NULL),
    ('Vzdělávání', '📚', '#f59e0b', NULL),
    ('Cestování', '✈️', '#22c55e', NULL),
    ('Zdraví', '💪', '#ec4899', NULL),
    ('Finance', '💰', '#84cc16', NULL),
    ('Zábava', '🎮', '#a855f7', NULL),
    ('Práce', '💼', '#3b82f6', NULL);
```

- [ ] **Step 2: Create indexes migration**

```sql
-- supabase/migrations/002_indexes.sql

-- Full-text search
CREATE INDEX idx_notes_fts ON notes USING GIN (
    to_tsvector('simple',
        COALESCE(title, '') || ' ' ||
        COALESCE(summary, '') || ' ' ||
        COALESCE(raw_content, '')
    )
);

-- Semantic search (pgvector) — use HNSW for better perf on small-medium datasets
CREATE INDEX idx_notes_embedding ON notes USING hnsw (embedding vector_cosine_ops);

-- Common queries
CREATE INDEX idx_notes_user_id ON notes (user_id);
CREATE INDEX idx_notes_status ON notes (status) WHERE status != 'ready';
CREATE INDEX idx_notes_content_type ON notes (user_id, content_type);
CREATE INDEX idx_notes_created_at ON notes (user_id, created_at DESC);
CREATE INDEX idx_notes_share_id ON notes (share_id) WHERE is_shared = true;
CREATE INDEX idx_tags_name ON tags (name);
CREATE INDEX idx_note_tags_note ON note_tags (note_id);
CREATE INDEX idx_note_tags_tag ON note_tags (tag_id);
CREATE INDEX idx_note_categories_note ON note_categories (note_id);
CREATE INDEX idx_note_categories_category ON note_categories (category_id);
```

- [ ] **Step 3: Create RLS policies migration**

```sql
-- supabase/migrations/003_rls_policies.sql

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Notes: owner full access + shared read
CREATE POLICY "Owner full access" ON notes
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Shared read access" ON notes
    FOR SELECT USING (is_shared = true AND share_id IS NOT NULL);

-- Tags: anyone can read, insert managed by app
CREATE POLICY "Public read tags" ON tags
    FOR SELECT USING (true);
CREATE POLICY "Authenticated insert tags" ON tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Categories: read all (system + own), create/modify own
CREATE POLICY "Read all categories" ON categories
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage own categories" ON categories
    FOR ALL USING (user_id = auth.uid());

-- Note tags: via note ownership
CREATE POLICY "Owner access note_tags" ON note_tags
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );

-- Note categories: via note ownership
CREATE POLICY "Owner access note_categories" ON note_categories
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );

-- Note images: via note ownership + shared read
CREATE POLICY "Owner access note_images" ON note_images
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );
CREATE POLICY "Shared image access" ON note_images
    FOR SELECT USING (
        note_id IN (SELECT id FROM notes WHERE is_shared = true)
    );

-- Profiles: own profile only
CREATE POLICY "Own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Usage limits: own data only
CREATE POLICY "Own usage" ON usage_limits
    FOR ALL USING (auth.uid() = user_id);

-- Shared collections: owner manages, public reads
CREATE POLICY "Owner manages collections" ON shared_collections
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read collections" ON shared_collections
    FOR SELECT USING (true);
```

- [ ] **Step 4: Apply migrations to Supabase**

Run migrations via Supabase Dashboard SQL Editor or `supabase db push` if using Supabase CLI.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, indexes, and RLS policies"
```

---

## Task 4: Zod Schemas & TypeScript Types

**Files:**
- Create: `src/lib/schemas.ts`, `src/types/note.ts`, `tests/lib/schemas.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write schema tests**

```typescript
// tests/lib/schemas.test.ts
import { describe, it, expect } from "vitest";
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from "@/lib/schemas";

describe("createNoteSchema", () => {
  it("validates a minimal text note", () => {
    const result = createNoteSchema.safeParse({
      title: "My note",
      content_type: "text",
    });
    expect(result.success).toBe(true);
  });

  it("validates a link note with URL", () => {
    const result = createNoteSchema.safeParse({
      title: "Interesting article",
      content_type: "link",
      source_url: "https://example.com/article",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createNoteSchema.safeParse({
      title: "",
      content_type: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createNoteSchema.safeParse({
      title: "x".repeat(201),
      content_type: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid content_type", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "podcast",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "link",
      source_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags as string array", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "text",
      tags: ["python", "AI"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts category_ids as UUID array", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "text",
      category_ids: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });
});

describe("updateNoteSchema", () => {
  it("validates partial update", () => {
    const result = updateNoteSchema.safeParse({
      title: "Updated title",
    });
    expect(result.success).toBe(true);
  });

  it("validates empty object (no changes)", () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("noteQuerySchema", () => {
  it("validates default query", () => {
    const result = noteQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("validates query with filters", () => {
    const result = noteQuerySchema.safeParse({
      content_type: "link",
      search: "python",
      sort: "alphabetical",
      limit: "10",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/lib/schemas.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 5: Create Zod schemas**

```typescript
// src/lib/schemas.ts
import { z } from "zod";

const contentTypes = ["link", "text", "video", "image", "recipe"] as const;

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).nullish(),
  content_type: z.enum(contentTypes).default("text"),
  source_url: z.string().url().nullish(),
  raw_content: z.string().max(50000).nullish(),
  structured_data: z.record(z.unknown()).default({}),
  language: z.string().length(2).default("cs"),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  category_ids: z.array(z.string().uuid()).max(10).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(2000).nullish(),
  content_type: z.enum(contentTypes).optional(),
  source_url: z.string().url().nullish(),
  raw_content: z.string().max(50000).nullish(),
  structured_data: z.record(z.unknown()).optional(),
  language: z.string().length(2).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  category_ids: z.array(z.string().uuid()).max(10).optional(),
});

export const noteQuerySchema = z.object({
  search: z.string().max(200).optional(),
  content_type: z.enum(contentTypes).optional(),
  tag: z.string().optional(),
  category_id: z.string().uuid().optional(),
  sort: z.enum(["newest", "oldest", "alphabetical"]).default("newest"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
```

- [ ] **Step 6: Create TypeScript types**

```typescript
// src/types/note.ts
export type ContentType = "link" | "text" | "video" | "image" | "recipe";
export type NoteStatus = "pending" | "processing" | "ready" | "error";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  content_type: ContentType;
  source_url: string | null;
  raw_content: string | null;
  structured_data: Record<string, unknown>;
  status: NoteStatus;
  processing_attempts: number;
  is_shared: boolean;
  share_id: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface NoteWithRelations extends Note {
  tags: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string | null }[];
  images: { id: string; storage_path: string; is_primary: boolean }[];
}

export interface Tag {
  id: string;
  name: string;
  usage_count: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  user_id: string | null;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/lib/schemas.test.ts`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/lib/schemas.ts src/types/note.ts tests/lib/schemas.test.ts package.json package-lock.json
git commit -m "feat: add Zod validation schemas and TypeScript types for notes"
```

---

## Task 5: Authentication

**Files:**
- Create: `src/components/AuthProvider.tsx`, `src/lib/auth-guard.ts`, `src/app/middleware.ts`, `src/app/auth/callback/route.ts`, `src/app/login/page.tsx`, `src/app/register/page.tsx`

- [ ] **Step 1: Create AuthProvider**

```tsx
// src/components/AuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContext>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Create auth guard helper**

```typescript
// src/lib/auth-guard.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { user, response: null } as const;
}
```

- [ ] **Step 3: Create middleware**

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/auth/callback", "/shared"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow API routes for shared content
  if (pathname.startsWith("/api/") && pathname.includes("shared")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
```

- [ ] **Step 4: Create OAuth callback handler**

```typescript
// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

- [ ] **Step 5: Create login page**

```tsx
// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Neplatný email nebo heslo.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Memula</h1>
          <p className="mt-1 text-sm text-gray-500">Přihlaste se ke svému účtu</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuth("google")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Google
          </button>
          <button
            onClick={() => handleOAuth("github")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            GitHub
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">nebo</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Nemáte účet?{" "}
          <a href="/register" className="font-medium text-brand hover:text-brand-dark">
            Zaregistrujte se
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create register page**

```tsx
// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Memula</h1>
          <p className="mt-1 text-sm text-gray-500">Vytvořte si účet</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <input
            type="text"
            placeholder="Jméno"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <input
            type="password"
            placeholder="Heslo (min. 6 znaků)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Vytvářím účet..." : "Vytvořit účet"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Máte účet?{" "}
          <a href="/login" className="font-medium text-brand hover:text-brand-dark">
            Přihlaste se
          </a>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update root layout with AuthProvider**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memula",
  description: "AI-powered personal note manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/AuthProvider.tsx src/lib/auth-guard.ts src/middleware.ts src/app/auth/ src/app/login/ src/app/register/ src/app/layout.tsx
git commit -m "feat: add authentication (OAuth Google/GitHub + email/password)"
```

---

## Task 6: Notes CRUD API

**Files:**
- Create: `src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts`, `src/app/api/tags/route.ts`

- [ ] **Step 1: Create notes list + create endpoint**

```typescript
// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema, noteQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = noteQuerySchema.safeParse(params);

  if (!query.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { search, content_type, tag, category_id, sort, limit, offset } = query.data;
  const supabase = await createClient();

  let q = supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name)),
      note_categories(category_id, categories(id, name, icon))
    `)
    .eq("user_id", auth.user.id);

  if (content_type) q = q.eq("content_type", content_type);
  if (search) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);

  switch (sort) {
    case "oldest":
      q = q.order("created_at", { ascending: true });
      break;
    case "alphabetical":
      q = q.order("title", { ascending: true });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data, count });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tags, category_ids, ...noteData } = parsed.data;
  const supabase = await createClient();

  // Create the note
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .insert({
      ...noteData,
      user_id: auth.user.id,
      status: noteData.source_url ? "pending" : "ready",
    })
    .select()
    .single();

  if (noteError) {
    return NextResponse.json({ error: noteError.message }, { status: 500 });
  }

  // Handle tags
  if (tags.length > 0) {
    for (const tagName of tags) {
      // Upsert tag
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase.from("note_tags").insert({
          note_id: note.id,
          tag_id: tag.id,
        });
      }
    }
  }

  // Handle categories
  if (category_ids.length > 0) {
    await supabase.from("note_categories").insert(
      category_ids.map((cid) => ({
        note_id: note.id,
        category_id: cid,
      }))
    );
  }

  return NextResponse.json(note, { status: 201 });
}
```

- [ ] **Step 2: Create single note endpoint**

```typescript
// src/app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { updateNoteSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name)),
      note_categories(category_id, categories(id, name, icon)),
      note_images(id, storage_path, is_primary)
    `)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tags, category_ids, ...noteData } = parsed.data;
  const supabase = await createClient();

  // Update note fields
  if (Object.keys(noteData).length > 0) {
    const { error } = await supabase
      .from("notes")
      .update(noteData)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Replace tags if provided
  if (tags !== undefined) {
    await supabase.from("note_tags").delete().eq("note_id", id);

    for (const tagName of tags) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase.from("note_tags").insert({
          note_id: id,
          tag_id: tag.id,
        });
      }
    }
  }

  // Replace categories if provided
  if (category_ids !== undefined) {
    await supabase.from("note_categories").delete().eq("note_id", id);

    if (category_ids.length > 0) {
      await supabase.from("note_categories").insert(
        category_ids.map((cid) => ({
          note_id: id,
          category_id: cid,
        }))
      );
    }
  }

  // Return updated note
  const { data } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name)),
      note_categories(category_id, categories(id, name, icon))
    `)
    .eq("id", id)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create tags autocomplete endpoint**

```typescript
// src/app/api/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const search = request.nextUrl.searchParams.get("q") ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("tags")
    .select("id, name, usage_count")
    .order("usage_count", { ascending: false })
    .limit(20);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add notes CRUD API and tags autocomplete endpoint"
```

---

## Task 7: Header & Sidebar Components

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1: Create Header component**

```tsx
// src/components/Header.tsx
"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function Header({ search, onSearchChange }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <a href="/" className="text-lg font-bold text-brand">
        📌 Memula
      </a>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Hledat..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="hidden w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand md:block"
        />

        <a
          href="/notes/new"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Nová
        </a>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600"
          >
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? "U"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Odhlásit se
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

```tsx
// src/components/Sidebar.tsx
"use client";

import type { ContentType, Category, Tag } from "@/types/note";

interface SidebarProps {
  counts: Record<string, number>;
  categories: Category[];
  popularTags: Tag[];
  activeType: ContentType | null;
  activeCategory: string | null;
  activeTag: string | null;
  onTypeChange: (type: ContentType | null) => void;
  onCategoryChange: (id: string | null) => void;
  onTagChange: (name: string | null) => void;
}

const typeConfig: { type: ContentType | null; label: string; icon: string }[] = [
  { type: null, label: "Všechny", icon: "📋" },
  { type: "link", label: "Odkazy", icon: "🔗" },
  { type: "text", label: "Poznámky", icon: "📝" },
  { type: "video", label: "Videa", icon: "🎬" },
  { type: "image", label: "Obrázky", icon: "🖼️" },
  { type: "recipe", label: "Recepty", icon: "🍳" },
];

export function Sidebar({
  counts,
  categories,
  popularTags,
  activeType,
  activeCategory,
  activeTag,
  onTypeChange,
  onCategoryChange,
  onTagChange,
}: SidebarProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <aside className="hidden w-52 shrink-0 space-y-6 border-r border-gray-200 bg-white p-4 md:block">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Typy
        </p>
        {typeConfig.map(({ type, label, icon }) => {
          const count = type ? (counts[type] ?? 0) : totalCount;
          const isActive = activeType === type;
          return (
            <button
              key={label}
              onClick={() => onTypeChange(type)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                isActive
                  ? "bg-brand text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>
                {icon} {label}
              </span>
              <span className={isActive ? "opacity-70" : "text-gray-400"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Kategorie
          </p>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                onCategoryChange(activeCategory === cat.id ? null : cat.id)
              }
              className={`flex w-full items-center rounded-lg px-2 py-1.5 text-sm ${
                activeCategory === cat.id
                  ? "bg-brand text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {popularTags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Oblíbené tagy
          </p>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  onTagChange(activeTag === tag.name ? null : tag.name)
                }
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  activeTag === tag.name
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx src/components/Sidebar.tsx
git commit -m "feat: add Header and Sidebar navigation components"
```

---

## Task 8: Note Card & Grid Components

**Files:**
- Create: `src/components/NoteCard.tsx`, `src/components/NoteGrid.tsx`

- [ ] **Step 1: Create NoteCard component**

```tsx
// src/components/NoteCard.tsx
import type { ContentType, NoteStatus } from "@/types/note";

interface NoteCardProps {
  id: string;
  title: string;
  summary: string | null;
  content_type: ContentType;
  status: NoteStatus;
  tags: { name: string }[];
  created_at: string;
  source_url: string | null;
}

const typeLabels: Record<ContentType, { label: string; color: string }> = {
  link: { label: "odkaz", color: "bg-blue-100 text-blue-800" },
  text: { label: "poznámka", color: "bg-green-100 text-green-800" },
  video: { label: "video", color: "bg-red-100 text-red-800" },
  image: { label: "obrázek", color: "bg-purple-100 text-purple-800" },
  recipe: { label: "recept", color: "bg-yellow-100 text-yellow-800" },
};

const typeIcons: Record<ContentType, string> = {
  link: "🔗",
  text: "📝",
  video: "🎬",
  image: "🖼️",
  recipe: "🍳",
};

export function NoteCard({
  id,
  title,
  summary,
  content_type,
  status,
  tags,
  created_at,
}: NoteCardProps) {
  const type = typeLabels[content_type];
  const isProcessing = status === "pending" || status === "processing";
  const isError = status === "error";

  const relativeDate = new Date(created_at).toLocaleDateString("cs-CZ");

  return (
    <a
      href={`/notes/${id}`}
      className={`block rounded-lg border bg-white transition-shadow hover:shadow-md ${
        isProcessing
          ? "border-yellow-300"
          : isError
          ? "border-red-300"
          : "border-gray-200"
      }`}
    >
      {/* Preview area */}
      <div
        className={`flex h-24 items-center justify-center rounded-t-lg ${
          isProcessing
            ? "bg-yellow-50"
            : isError
            ? "bg-red-50"
            : "bg-gray-50"
        }`}
      >
        {isProcessing ? (
          <div className="text-center">
            <div className="text-xl">⏳</div>
            <div className="text-xs text-yellow-700">Zpracovává se...</div>
          </div>
        ) : isError ? (
          <div className="text-center">
            <div className="text-xl">⚠️</div>
            <div className="text-xs text-red-700">Chyba zpracování</div>
          </div>
        ) : (
          <div className="text-3xl">{typeIcons[content_type]}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {title}
        </h3>
        {summary && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{summary}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${type.color}`}
            >
              {type.label}
            </span>
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.name}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
              >
                #{tag.name}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">{relativeDate}</span>
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 2: Create NoteGrid component**

```tsx
// src/components/NoteGrid.tsx
import { NoteCard } from "./NoteCard";

interface NoteGridProps {
  notes: Array<{
    id: string;
    title: string;
    summary: string | null;
    content_type: "link" | "text" | "video" | "image" | "recipe";
    status: "pending" | "processing" | "ready" | "error";
    source_url: string | null;
    created_at: string;
    note_tags: Array<{ tags: { name: string } }>;
  }>;
}

export function NoteGrid({ notes }: NoteGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="text-4xl">📝</div>
        <p className="mt-3 text-sm">Zatím žádné poznámky</p>
        <a
          href="/notes/new"
          className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Přidat první poznámku
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          title={note.title}
          summary={note.summary}
          content_type={note.content_type}
          status={note.status}
          source_url={note.source_url}
          created_at={note.created_at}
          tags={note.note_tags.map((nt) => nt.tags)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NoteCard.tsx src/components/NoteGrid.tsx
git commit -m "feat: add NoteCard and NoteGrid components"
```

---

## Task 9: Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement dashboard page**

```tsx
// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { NoteGrid } from "@/components/NoteGrid";
import type { ContentType, Category, Tag } from "@/types/note";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ContentType | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeType) params.set("content_type", activeType);
    if (activeTag) params.set("tag", activeTag);
    if (activeCategory) params.set("category_id", activeCategory);

    const res = await fetch(`/api/notes?${params}`);
    const data = await res.json();
    setNotes(data.notes ?? []);
    setLoading(false);
  }, [user, search, activeType, activeTag, activeCategory]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Fetch categories and popular tags
    Promise.all([
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("name"),
      supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(10),
    ]).then(([catRes, tagRes]) => {
      setCategories(catRes.data ?? []);
      setPopularTags(tagRes.data ?? []);
    });
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  // Compute type counts from notes
  useEffect(() => {
    const c: Record<string, number> = {};
    for (const n of notes) {
      c[n.content_type] = (c[n.content_type] ?? 0) + 1;
    }
    setCounts(c);
  }, [notes]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Načítám...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header search={search} onSearchChange={setSearch} />
      <div className="flex flex-1">
        <Sidebar
          counts={counts}
          categories={categories}
          popularTags={popularTags}
          activeType={activeType}
          activeCategory={activeCategory}
          activeTag={activeTag}
          onTypeChange={setActiveType}
          onCategoryChange={setActiveCategory}
          onTagChange={setActiveTag}
        />
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              Načítám poznámky...
            </div>
          ) : (
            <NoteGrid notes={notes} />
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the dashboard renders**

Run: `npm run dev`
Navigate to http://localhost:3000 (should redirect to /login if not authenticated)

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: implement dashboard page with note grid and sidebar filters"
```

---

## Task 10: Note Form (Create & Edit)

**Files:**
- Create: `src/components/NoteForm.tsx`, `src/app/notes/new/page.tsx`, `src/app/notes/[id]/edit/page.tsx`

- [ ] **Step 1: Create NoteForm component**

```tsx
// src/components/NoteForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/note";

interface NoteFormProps {
  noteId?: string;
  initialData?: {
    title: string;
    summary: string | null;
    content_type: string;
    source_url: string | null;
    raw_content: string | null;
    tags: string[];
    category_ids: string[];
  };
}

const contentTypes = [
  { value: "text", label: "📝 Poznámka" },
  { value: "link", label: "🔗 Odkaz" },
  { value: "video", label: "🎬 Video" },
  { value: "image", label: "🖼️ Obrázek" },
  { value: "recipe", label: "🍳 Recept" },
];

export function NoteForm({ noteId, initialData }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [contentType, setContentType] = useState(initialData?.content_type ?? "text");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? "");
  const [rawContent, setRawContent] = useState(initialData?.raw_content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.category_ids ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      title,
      content_type: contentType,
      source_url: sourceUrl || null,
      raw_content: rawContent || null,
      tags,
      category_ids: categoryIds,
    };

    const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
    const method = noteId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/notes/${data.id ?? noteId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Uložení se nezdařilo.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">
        {noteId ? "Upravit poznámku" : "Nová poznámka"}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Content type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Typ</label>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setContentType(ct.value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                contentType === ct.value
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Název</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* URL (for link/video) */}
      {(contentType === "link" || contentType === "video") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {/* Content (for text/recipe) */}
      {(contentType === "text" || contentType === "recipe") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Obsah</label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            rows={8}
            maxLength={50000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Štítky</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Přidejte štítek..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Přidat
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-brand/60 hover:text-brand"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                categoryIds.includes(cat.id)
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Ukládám..." : noteId ? "Uložit změny" : "Vytvořit poznámku"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create new note page**

```tsx
// src/app/notes/new/page.tsx
import { NoteForm } from "@/components/NoteForm";

export default function NewNotePage() {
  return <NoteForm />;
}
```

- [ ] **Step 3: Create edit note page**

```tsx
// src/app/notes/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteForm } from "@/components/NoteForm";

export default function EditNotePage() {
  const params = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notes/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setInitialData({
          title: data.title,
          summary: data.summary,
          content_type: data.content_type,
          source_url: data.source_url,
          raw_content: data.raw_content,
          tags: data.note_tags?.map((nt: any) => nt.tags.name) ?? [],
          category_ids:
            data.note_categories?.map((nc: any) => nc.categories.id) ?? [],
        });
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Načítám...
      </div>
    );
  }

  return (
    <NoteForm noteId={params.id as string} initialData={initialData} />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/NoteForm.tsx src/app/notes/
git commit -m "feat: add note create and edit forms with tag and category management"
```

---

## Task 11: Note Detail Page

**Files:**
- Create: `src/components/NoteDetail.tsx`, `src/app/notes/[id]/page.tsx`

- [ ] **Step 1: Create NoteDetail component**

```tsx
// src/components/NoteDetail.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContentType } from "@/types/note";

interface NoteDetailProps {
  note: {
    id: string;
    title: string;
    summary: string | null;
    content_type: ContentType;
    source_url: string | null;
    raw_content: string | null;
    structured_data: Record<string, unknown>;
    status: string;
    language: string;
    created_at: string;
    updated_at: string;
    note_tags: Array<{ tags: { id: string; name: string } }>;
    note_categories: Array<{
      categories: { id: string; name: string; icon: string | null };
    }>;
  };
}

export function NoteDetail({ note }: NoteDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Opravdu chcete smazat tuto poznámku?")) return;
    setDeleting(true);

    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      setDeleting(false);
      alert("Smazání se nezdařilo.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(note.created_at).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/notes/${note.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Upravit
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Mažu..." : "Smazat"}
          </button>
        </div>
      </div>

      {/* Categories & Tags */}
      <div className="flex flex-wrap gap-2">
        {note.note_categories.map((nc) => (
          <span
            key={nc.categories.id}
            className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
          >
            {nc.categories.icon} {nc.categories.name}
          </span>
        ))}
        {note.note_tags.map((nt) => (
          <span
            key={nt.tags.id}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
          >
            #{nt.tags.name}
          </span>
        ))}
      </div>

      {/* Source URL */}
      {note.source_url && (
        <a
          href={note.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-brand hover:underline"
        >
          {note.source_url}
        </a>
      )}

      {/* Summary */}
      {note.summary && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">Souhrn</p>
          <p className="mt-1 text-gray-700">{note.summary}</p>
        </div>
      )}

      {/* Content */}
      {note.raw_content && (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{note.raw_content}</p>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Zpět na přehled
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create note detail page**

```tsx
// src/app/notes/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteDetail } from "@/components/NoteDetail";

export default function NoteDetailPage() {
  const params = useParams();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/notes/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setNote(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Načítám...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Poznámka nebyla nalezena.
      </div>
    );
  }

  return <NoteDetail note={note} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NoteDetail.tsx src/app/notes/
git commit -m "feat: add note detail page with edit and delete actions"
```

---

## Task 12: Build Verification & Final Commit

**Files:** None new — verification only

- [ ] **Step 1: Run tests**

```bash
npx vitest run
```
Expected: All schema tests pass

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual verification**

1. Start dev server: `npm run dev`
2. Visit http://localhost:3000 → redirects to /login
3. Register a new account → redirected to /login with success
4. Login → dashboard with empty note grid
5. Click "+ Nová" → note form loads
6. Create a text note with tags and categories → redirects to detail page
7. Click "Upravit" → edit form with prefilled data
8. Click "Smazat" → confirm → redirected to dashboard
9. Sidebar filters respond to clicks

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve build issues from Phase 1 integration"
```

---

## Phase Summary

After completing Phase 1, you will have:
- ✅ Next.js project with Tailwind CSS and TypeScript
- ✅ Supabase database with full schema, indexes, and RLS
- ✅ Authentication (Google OAuth, GitHub OAuth, email/password)
- ✅ Notes CRUD API with Zod validation
- ✅ Dashboard with card grid, sidebar filters, search
- ✅ Note create/edit forms with tag and category management
- ✅ Note detail page with delete capability

**Next phases:**
- Phase 2: AI Pipeline (background processing, GPT-4o classification + extraction, embeddings)
- Phase 3: Search (fulltext + semantic + hybrid ranking)
- Phase 4: Security Hardening (rate limiting, CSP headers, Turnstile, SSRF)
- Phase 5: PWA + Entry Points (Share Target, service worker, quick add)
- Phase 6: Export & Sharing (Markdown/JSON/PDF, shared links, collections)
- Phase 7: Chrome Extension
