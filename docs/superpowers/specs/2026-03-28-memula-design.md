# Memula — Design Specification

## Overview

AI-powered note-taking application for saving, organizing, and retrieving links, notes, videos, and images. The app automatically recognizes content type, extracts structured metadata, generates summaries, assigns tags and categories — all with user approval. Designed as a public web application with freemium model.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (OAuth: Google, GitHub + email/password) |
| Storage | Supabase Storage (images, uploads) |
| AI | OpenAI GPT-4o (classification, extraction, summaries) + Embeddings API |
| Background Jobs | Supabase Database Webhooks → Edge Functions |
| Hosting | Vercel (frontend) + Supabase (backend) |
| Language | TypeScript throughout |
| Anti-bot | Cloudflare Turnstile |

## Architecture

Monolithic Next.js application with asynchronous AI processing via background jobs.

**Flow:**
1. User saves content (URL, text, image) → record created with `status = 'pending'`
2. Database webhook triggers Supabase Edge Function
3. Edge Function: downloads content → GPT-4o classifies type + extracts structured data → generates embedding
4. Record updated to `status = 'ready'`, UI refreshes via Supabase Realtime
5. User reviews AI suggestions (tags, categories, summary) → approves or edits → saves

**Error handling:** After 3 failed processing attempts → `status = 'error'`, user sees "Retry" button. Cleanup cron checks for stuck `pending` records every 5 minutes.

## Database Schema

### Core Tables

```sql
-- Content types recognized by AI
CREATE TYPE content_type AS ENUM ('link', 'text', 'video', 'image', 'recipe');
CREATE TYPE note_status AS ENUM ('pending', 'processing', 'ready', 'error');

-- Main notes table
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,                          -- AI-generated summary
    content_type content_type NOT NULL DEFAULT 'text',
    source_url TEXT,                       -- Original URL (if applicable)
    raw_content TEXT,                      -- Original text/HTML
    structured_data JSONB DEFAULT '{}',    -- Type-specific metadata (see below)
    embedding vector(1536),                -- pgvector for semantic search
    status note_status NOT NULL DEFAULT 'pending',
    processing_attempts INT DEFAULT 0,
    is_shared BOOLEAN DEFAULT false,       -- Public sharing enabled
    share_id UUID UNIQUE,                  -- Random ID for shared URL
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
    is_ai_suggested BOOLEAN DEFAULT false,  -- AI suggested vs user added
    PRIMARY KEY (note_id, tag_id)
);

-- Categories (system-wide + user-created)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,                              -- Emoji icon
    color TEXT,                             -- Hex color
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system category
    UNIQUE (name, user_id)
);

-- Many-to-many: notes <-> categories
CREATE TABLE note_categories (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_ai_suggested BOOLEAN DEFAULT false,
    PRIMARY KEY (note_id, category_id)
);

-- Note images (multiple per note)
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

-- AI usage tracking (freemium limits)
CREATE TABLE usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,                    -- '2026-03' format
    ai_processing_count INT DEFAULT 0,
    UNIQUE (user_id, month)
);

-- Shared collections (filtered views)
CREATE TABLE shared_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    filter_categories UUID[],              -- Category IDs to include
    filter_tags UUID[],                    -- Tag IDs to include
    filter_content_types content_type[],   -- Content types to include
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Full-text search (Czech + simple for multilingual)
CREATE INDEX idx_notes_fts ON notes USING GIN (
    to_tsvector('simple',
        COALESCE(title, '') || ' ' ||
        COALESCE(summary, '') || ' ' ||
        COALESCE(raw_content, '')
    )
);

-- Semantic search (pgvector)
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

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

### Row Level Security

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;

-- Notes: owner access + shared read
CREATE POLICY "Owner full access" ON notes
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Shared read access" ON notes
    FOR SELECT USING (is_shared = true AND share_id IS NOT NULL);

-- Tags: public read, system manages writes
CREATE POLICY "Public read tags" ON tags FOR SELECT USING (true);

-- Note tags/categories: via note ownership
CREATE POLICY "Owner access via note" ON note_tags
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner access via note" ON note_categories
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );

-- Profiles: own profile only
CREATE POLICY "Own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Usage limits: own data only
CREATE POLICY "Own usage" ON usage_limits
    FOR ALL USING (auth.uid() = user_id);

-- Note images: via note ownership
CREATE POLICY "Owner access via note" ON note_images
    FOR ALL USING (
        note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
    );
CREATE POLICY "Shared image access" ON note_images
    FOR SELECT USING (
        note_id IN (SELECT id FROM notes WHERE is_shared = true)
    );

-- Shared collections: owner manages, public reads
CREATE POLICY "Owner manages collections" ON shared_collections
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read collections" ON shared_collections
    FOR SELECT USING (true);
```

### Structured Data by Content Type

**content_type = 'recipe':**
```json
{
  "ingredients": [{"name": "mouka", "amount": "500", "unit": "g", "group": "těsto"}],
  "instructions": [{"step": 1, "text": "Smíchejte..."}],
  "prep_time_minutes": 30,
  "cook_time_minutes": 45,
  "servings": "4 porce",
  "cuisine": "italská",
  "difficulty": "snadné"
}
```

**content_type = 'link':**
```json
{
  "domain": "medium.com",
  "author": "John Doe",
  "published_at": "2026-01-15",
  "read_time_min": 8,
  "key_points": ["Point 1", "Point 2"]
}
```

**content_type = 'video':**
```json
{
  "platform": "youtube",
  "video_id": "dQw4w9WgXcQ",
  "channel": "Fireship",
  "duration_sec": 480,
  "thumbnail_url": "https://...",
  "key_points": ["Point 1", "Point 2"]
}
```

**content_type = 'text':**
```json
{
  "word_count": 350,
  "format": "markdown",
  "key_points": ["Point 1", "Point 2"]
}
```

**content_type = 'image':**
```json
{
  "dimensions": {"width": 1920, "height": 1080},
  "description": "AI-generated image description",
  "detected_text": "OCR extracted text if any"
}
```

## AI Pipeline

### Classification + Extraction Prompt

```
You are a content classification and extraction assistant.

1. Determine the content type: link, text, video, image, or recipe.
2. Extract structured metadata specific to that type.
3. Generate a concise summary (2-3 sentences).
4. Suggest relevant tags (3-8).
5. Suggest 1-3 categories from the available list.

Return JSON:
{
  "content_type": string,
  "title": string,
  "summary": string,
  "structured_data": object,
  "suggested_tags": string[],
  "suggested_categories": string[],
  "language": string (ISO 639-1)
}

Rules:
- Keep the original language of the content. Do not translate.
- For recipes: extract ingredients with amounts/units, step-by-step instructions.
- For links/articles: extract key points, author, read time.
- For videos: extract key points, duration, channel.
- Return ONLY valid JSON.
```

### Embedding Generation

- Model: `text-embedding-3-small` (1536 dimensions)
- Input: `title + " " + summary + " " + key content` (truncated to 8000 tokens)
- Generated after classification + extraction in the same Edge Function call

### Freemium Limits

| Feature | Free | Pro |
|---|---|---|
| AI processing / month | 50 | Unlimited |
| Semantic search | No | Yes |
| AI chat with notes | No | Yes |
| Max notes | 500 | Unlimited |
| Max storage | 100 MB | 5 GB |
| Export | Markdown, JSON | Markdown, JSON, PDF |

## Search

### Three Layers

1. **Full-text search** (Free) — PostgreSQL `tsvector` index over title, summary, raw_content, tags. Uses `'simple'` dictionary for multilingual support.

2. **Semantic search** (Pro) — pgvector cosine similarity on embedding column. User query is embedded via same model, then compared. Hybrid ranking combines fulltext score + vector similarity.

3. **Filters** (Free) — Combinable: content type, tags, categories, date range, language. Work standalone or combined with text/semantic search.

### Search UX

- Single search bar with 300ms debounce
- Type filter chips below search bar (All, Links, Notes, Videos, Images, Recipes)
- Results show: title, type badge, summary, tags, relative date
- Sort: most relevant / newest / alphabetical
- Search runs as Supabase RPC function (server-side)

## UI Structure

### Pages

| Route | Description |
|---|---|
| `/` | Dashboard — note grid + sidebar (types, categories, tags) |
| `/notes/[id]` | Note detail — full content, structured data, edit capabilities |
| `/notes/new` | New note — URL input / text editor / image upload |
| `/search` | Search results (or integrated in dashboard) |
| `/settings` | User profile, tier info, usage stats |
| `/login` | OAuth (Google, GitHub) + email/password |
| `/register` | Registration with Turnstile |
| `/shared/[shareId]` | Public read-only note view |
| `/shared/collection/[shareId]` | Public read-only filtered collection |

### Layout

- **Desktop:** Sidebar (types, categories, favorite tags) + main content area (card grid)
- **Mobile:** Bottom tab bar + top search bar + FAB "+" button
- **Card grid:** Responsive — 3 columns (desktop) → 2 (tablet) → 1 (mobile)
- **Cards show:** Preview image/text/icon, title, summary, type badge, tags, relative date

### Entry Points

1. **PWA Share** (mobile) — Share from browser → app saves URL → AI processes in background
2. **Web editor** — Open app → "+" → paste URL / write text / upload image → preview AI suggestions → approve → save
3. **Chrome Extension** (desktop) — Click icon on any page → popup shows preview → "Save" → done
4. **Quick add** (keyboard shortcut "N") — Opens minimal input → paste URL or type → Enter → saved

### Tag & Category Management

- AI suggests tags and categories during processing
- User can approve, edit, add, or remove suggestions before saving
- One note can have multiple tags AND multiple categories (many-to-many)
- Tags: shared globally, autocomplete from existing tags sorted by usage
- Categories: system-provided defaults + user-created custom categories

## Security

### Authentication & Authorization

- **OAuth:** Google + GitHub as primary (via Supabase Auth)
- **Email/password:** Fallback with mandatory email verification
- **RLS:** All tables protected — user sees only their own data at database level
- **Session:** Supabase JWT with automatic refresh, HttpOnly cookies server-side

### API Protection

- **Rate limiting** (per user + per IP):
  - Auth endpoints: 5 req/min/IP
  - AI processing: 10 req/min/user
  - CRUD operations: 60 req/min/user
  - Search: 30 req/min/user
- **Input validation:** Zod schemas on every API endpoint
  - URL validation + SSRF prevention (block private IPs: 127.0.0.1, 10.x, 192.168.x, 169.254.x)
  - Text limits: title max 200 chars, content max 50,000 chars
  - Upload limits: max 10MB per file, allowed MIME types only
- **HTML sanitization:** DOMPurify before storage and display (XSS prevention)

### Anti-Abuse

- **Cloudflare Turnstile** on registration and login forms (invisible CAPTCHA)
- **AI quota check** before calling GPT-4o (not after)
- **Content limits:** Max notes per user (Free: 500), max storage per user (Free: 100MB)
- **URL scraping protection:** Domain blocklist, max response size 5MB, fetch timeout 10s

### HTTP Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Export & Sharing

### Export Formats

- **Markdown:** Single note or bulk export. Compatible with Obsidian, Notion, GitHub.
- **JSON:** Complete data including structured_data. For backups, migrations, API consumption.
- **PDF** (Pro): Formatted export with images. Ideal for NotebookLM, archival.

### NotebookLM Integration

Two paths:
1. **Shared URL:** Enable sharing on a note → paste URL into NotebookLM as source (zero effort)
2. **PDF export:** Bulk export notes as PDF → upload to NotebookLM or Google Docs

### Sharing Model

- **Default:** Private — only owner can see
- **Share by link:** Read-only access via unique UUID URL (`/shared/[shareId]`)
- **Share collection:** Filtered view (category + tags + content type) shared via single link (`/shared/collection/[shareId]?category=recepty&tag=italske`)
- **Principle:** No data is public unless explicitly shared by user

## PWA Configuration

```json
{
  "name": "Memula",
  "short_name": "Memula",
  "description": "AI-powered personal note manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "share_target": {
    "action": "/api/share",
    "method": "GET",
    "params": {
      "url": "url",
      "title": "title",
      "text": "text"
    }
  }
}
```

## Chrome Extension

Manifest V3 extension for desktop. Detects page content, shows preview in popup, saves to app via API.

- **Content script:** Detects JSON-LD, og:tags, page metadata
- **Popup:** Shows preview (title, image, description) + "Save" button + optional note field
- **Background worker:** Calls `POST /api/notes` with auth token from `chrome.storage.local`
- **Auth:** First-use login in popup → stores Supabase token

## Future Considerations (Not in MVP)

- **Capacitor wrapper** for native App Store / Google Play distribution
- **2FA** (two-factor authentication)
- **AI chat with notes** — "What did I save about Python?" conversational interface
- **AI connections** — "This video relates to this article you saved last week"
- **Collaborative notes** — multiple users editing shared notes
- **Audit log** — who did what, when
- **Stripe integration** for Pro tier payments
