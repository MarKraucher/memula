# Memula Phase 2: AI Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered content processing — when a user saves a note (especially a URL), the system automatically classifies content type, extracts structured metadata, generates a summary, suggests tags and categories, and creates an embedding for future semantic search.

**Architecture:** Next.js API route `/api/notes/[id]/process` handles AI processing using OpenAI GPT-4o for classification/extraction and `text-embedding-3-small` for embeddings. Processing is triggered client-side after note creation. Freemium limits are enforced before calling OpenAI (50 AI requests/month for free users). URL content is fetched server-side with SSRF protection.

**Tech Stack:** OpenAI SDK (`openai` npm package), existing Next.js API routes, Supabase (database + auth), Zod validation

**Spec Reference:** `docs/superpowers/specs/2026-03-28-memula-design.md` — AI Pipeline, Embedding Generation, Freemium Limits sections

---

## File Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── openai.ts              # OpenAI client singleton
│   │   ├── classify.ts            # GPT-4o classification + extraction
│   │   ├── embed.ts               # Embedding generation
│   │   └── fetch-content.ts       # URL content fetcher with SSRF protection
│   ├── usage.ts                   # Freemium limit checking + incrementing
│   └── schemas.ts                 # (modify) Add AI response schema
├── app/
│   ├── api/
│   │   └── notes/
│   │       ├── route.ts           # (modify) Trigger processing after creation
│   │       └── [id]/
│   │           └── process/
│   │               └── route.ts   # NEW: AI processing endpoint
│   └── page.tsx                   # (modify) Show processing status + poll
├── components/
│   ├── NoteCard.tsx               # (modify) Show processing spinner
│   └── AiSuggestions.tsx          # NEW: Review/approve AI suggestions
├── types/
│   └── note.ts                    # (modify) Add AI response types
.env.local.example                 # (modify) Add OPENAI_API_KEY
tests/
├── lib/
│   ├── usage.test.ts              # Freemium limit tests
│   ├── fetch-content.test.ts      # URL fetcher + SSRF tests
│   └── schemas.test.ts            # (modify) Add AI schema tests
```

---

## Task 1: Supabase Project Setup

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: Create Supabase project for Memula**

Use the Supabase MCP tool `create_project` to create a new project named "Memula" in region `eu-west-1`.

- [ ] **Step 2: Apply database migrations**

Use the Supabase MCP tool `apply_migration` to apply each migration file in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_indexes.sql`
3. `supabase/migrations/003_rls_policies.sql`

- [ ] **Step 3: Get project URL and keys**

Use the Supabase MCP tool `get_project_url` and `get_publishable_keys` to retrieve:
- Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

- [ ] **Step 4: Create .env.local with real credentials**

Create `.env.local` (not committed) with the Supabase credentials. Also add the OpenAI API key placeholder:

```env
NEXT_PUBLIC_SUPABASE_URL=<from step 3>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 3>
OPENAI_API_KEY=<user must provide>
```

- [ ] **Step 5: Update .env.local.example**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

- [ ] **Step 6: Commit**

```bash
git add .env.local.example
git commit -m "feat: add OpenAI API key to env example"
```

---

## Task 2: OpenAI SDK + Client Setup

**Files:**
- Create: `src/lib/ai/openai.ts`

- [ ] **Step 1: Install OpenAI SDK**

```bash
npm install openai
```

- [ ] **Step 2: Create OpenAI client**

```typescript
// src/lib/ai/openai.ts
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/openai.ts package.json package-lock.json
git commit -m "feat: add OpenAI SDK and client singleton"
```

---

## Task 3: URL Content Fetcher with SSRF Protection

**Files:**
- Create: `src/lib/ai/fetch-content.ts`, `tests/lib/fetch-content.test.ts`

- [ ] **Step 1: Write tests for URL fetcher**

```typescript
// tests/lib/fetch-content.test.ts
import { describe, it, expect } from "vitest";
import { isPrivateUrl } from "@/lib/ai/fetch-content";

describe("isPrivateUrl", () => {
  it("blocks localhost", () => {
    expect(isPrivateUrl("http://localhost/path")).toBe(true);
    expect(isPrivateUrl("http://127.0.0.1/path")).toBe(true);
  });

  it("blocks private IP ranges", () => {
    expect(isPrivateUrl("http://10.0.0.1/page")).toBe(true);
    expect(isPrivateUrl("http://192.168.1.1/page")).toBe(true);
    expect(isPrivateUrl("http://169.254.169.254/metadata")).toBe(true);
  });

  it("blocks 0.0.0.0", () => {
    expect(isPrivateUrl("http://0.0.0.0/page")).toBe(true);
  });

  it("allows public URLs", () => {
    expect(isPrivateUrl("https://example.com/page")).toBe(false);
    expect(isPrivateUrl("https://github.com/repo")).toBe(false);
  });

  it("blocks non-http protocols", () => {
    expect(isPrivateUrl("file:///etc/passwd")).toBe(true);
    expect(isPrivateUrl("ftp://server.com/file")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/fetch-content.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement URL fetcher**

```typescript
// src/lib/ai/fetch-content.ts

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = ["localhost", "[::1]"];

export function isPrivateUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return true; // Invalid URLs are blocked
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return true;
  }

  const hostname = parsed.hostname;

  // Block known private hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return true;
  }

  // Block private IP ranges
  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true;
  }

  return false;
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10_000; // 10s

export async function fetchUrlContent(url: string): Promise<string> {
  if (isPrivateUrl(url)) {
    throw new Error("URL points to a private/internal address");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Memula/1.0 (content-fetcher)",
        Accept: "text/html,application/json,text/plain",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error("Response too large (max 5MB)");
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_SIZE) {
      return text.slice(0, MAX_RESPONSE_SIZE);
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/fetch-content.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/fetch-content.ts tests/lib/fetch-content.test.ts
git commit -m "feat: add URL content fetcher with SSRF protection"
```

---

## Task 4: Freemium Usage Limits

**Files:**
- Create: `src/lib/usage.ts`, `tests/lib/usage.test.ts`

- [ ] **Step 1: Write tests for usage limit helpers**

```typescript
// tests/lib/usage.test.ts
import { describe, it, expect } from "vitest";
import { getCurrentMonth, FREE_TIER_AI_LIMIT } from "@/lib/usage";

describe("usage helpers", () => {
  it("getCurrentMonth returns YYYY-MM format", () => {
    const month = getCurrentMonth();
    expect(month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("FREE_TIER_AI_LIMIT is 50", () => {
    expect(FREE_TIER_AI_LIMIT).toBe(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/usage.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement usage limit helpers**

```typescript
// src/lib/usage.ts
import { createClient } from "@/lib/supabase/server";

export const FREE_TIER_AI_LIMIT = 50;

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function checkAndIncrementUsage(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const supabase = await createClient();
  const month = getCurrentMonth();

  // Check user tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  // Pro users have unlimited AI processing
  if (profile?.tier === "pro") {
    // Still track usage for analytics
    await supabase.rpc("increment_usage", { p_user_id: userId, p_month: month });
    return { allowed: true, count: 0, limit: Infinity };
  }

  // Get current usage for free tier
  const { data: usage } = await supabase
    .from("usage_limits")
    .select("ai_processing_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  const currentCount = usage?.ai_processing_count ?? 0;

  if (currentCount >= FREE_TIER_AI_LIMIT) {
    return { allowed: false, count: currentCount, limit: FREE_TIER_AI_LIMIT };
  }

  // Increment usage — upsert to handle first use of the month
  await supabase
    .from("usage_limits")
    .upsert(
      {
        user_id: userId,
        month,
        ai_processing_count: currentCount + 1,
      },
      { onConflict: "user_id,month" }
    );

  return { allowed: true, count: currentCount + 1, limit: FREE_TIER_AI_LIMIT };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/usage.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/usage.ts tests/lib/usage.test.ts
git commit -m "feat: add freemium usage limit checking"
```

---

## Task 5: AI Classification + Extraction

**Files:**
- Create: `src/lib/ai/classify.ts`
- Modify: `src/types/note.ts`

- [ ] **Step 1: Add AI response types**

Add to the end of `src/types/note.ts`:

```typescript
export interface AiClassificationResult {
  content_type: ContentType;
  title: string;
  summary: string;
  structured_data: Record<string, unknown>;
  suggested_tags: string[];
  suggested_categories: string[];
  language: string;
}
```

- [ ] **Step 2: Create classification module**

```typescript
// src/lib/ai/classify.ts
import { getOpenAI } from "./openai";
import type { AiClassificationResult } from "@/types/note";

const SYSTEM_PROMPT = `You are a content classification and extraction assistant.

1. Determine the content type: link, text, video, image, or recipe.
2. Extract structured metadata specific to that type.
3. Generate a concise summary (2-3 sentences).
4. Suggest relevant tags (3-8).
5. Suggest 1-3 categories from this list: Technologie, Vaření, Vzdělávání, Cestování, Zdraví, Finance, Zábava, Práce.

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
- Return ONLY valid JSON.`;

export async function classifyContent(input: {
  title: string;
  rawContent: string | null;
  sourceUrl: string | null;
  fetchedHtml: string | null;
}): Promise<AiClassificationResult> {
  const openai = getOpenAI();

  let userMessage = "";
  if (input.sourceUrl) {
    userMessage += `URL: ${input.sourceUrl}\n\n`;
  }
  if (input.title) {
    userMessage += `Title: ${input.title}\n\n`;
  }
  if (input.fetchedHtml) {
    // Truncate HTML to ~15000 chars to stay within token limits
    const truncated = input.fetchedHtml.slice(0, 15000);
    userMessage += `Page content:\n${truncated}\n\n`;
  }
  if (input.rawContent) {
    const truncated = input.rawContent.slice(0, 15000);
    userMessage += `User content:\n${truncated}\n\n`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(text) as AiClassificationResult;

  // Validate required fields
  if (!parsed.content_type || !parsed.title || !parsed.summary) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/classify.ts src/types/note.ts
git commit -m "feat: add GPT-4o content classification and extraction"
```

---

## Task 6: Embedding Generation

**Files:**
- Create: `src/lib/ai/embed.ts`

- [ ] **Step 1: Create embedding module**

```typescript
// src/lib/ai/embed.ts
import { getOpenAI } from "./openai";

const MAX_INPUT_LENGTH = 30000; // ~8000 tokens rough estimate

export async function generateEmbedding(input: {
  title: string;
  summary: string;
  content: string | null;
}): Promise<number[]> {
  const openai = getOpenAI();

  let text = `${input.title} ${input.summary}`;
  if (input.content) {
    text += ` ${input.content}`;
  }

  // Truncate to stay within token limits
  if (text.length > MAX_INPUT_LENGTH) {
    text = text.slice(0, MAX_INPUT_LENGTH);
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/embed.ts
git commit -m "feat: add embedding generation with text-embedding-3-small"
```

---

## Task 7: AI Processing API Route

**Files:**
- Create: `src/app/api/notes/[id]/process/route.ts`

- [ ] **Step 1: Create the processing endpoint**

```typescript
// src/app/api/notes/[id]/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { classifyContent } from "@/lib/ai/classify";
import { generateEmbedding } from "@/lib/ai/embed";
import { fetchUrlContent } from "@/lib/ai/fetch-content";
import { checkAndIncrementUsage } from "@/lib/usage";

const MAX_PROCESSING_ATTEMPTS = 3;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  // Fetch the note
  const { data: note, error: fetchError } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (fetchError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Check if already processed
  if (note.status === "ready") {
    return NextResponse.json({ message: "Already processed" });
  }

  // Check max attempts
  if (note.processing_attempts >= MAX_PROCESSING_ATTEMPTS) {
    await supabase
      .from("notes")
      .update({ status: "error" })
      .eq("id", id);
    return NextResponse.json(
      { error: "Max processing attempts reached" },
      { status: 422 }
    );
  }

  // Check freemium limits BEFORE calling OpenAI
  const usage = await checkAndIncrementUsage(auth.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: "Měsíční limit AI zpracování vyčerpán",
        count: usage.count,
        limit: usage.limit,
      },
      { status: 429 }
    );
  }

  // Mark as processing
  await supabase
    .from("notes")
    .update({
      status: "processing",
      processing_attempts: note.processing_attempts + 1,
    })
    .eq("id", id);

  try {
    // Fetch URL content if applicable
    let fetchedHtml: string | null = null;
    if (note.source_url) {
      try {
        fetchedHtml = await fetchUrlContent(note.source_url);
      } catch {
        // URL fetch failed — continue with what we have
      }
    }

    // Classify content with GPT-4o
    const classification = await classifyContent({
      title: note.title,
      rawContent: note.raw_content,
      sourceUrl: note.source_url,
      fetchedHtml,
    });

    // Generate embedding
    const embedding = await generateEmbedding({
      title: classification.title,
      summary: classification.summary,
      content: note.raw_content,
    });

    // Update note with AI results
    await supabase
      .from("notes")
      .update({
        title: classification.title,
        summary: classification.summary,
        content_type: classification.content_type,
        structured_data: classification.structured_data,
        language: classification.language,
        embedding: JSON.stringify(embedding),
        status: "ready",
      })
      .eq("id", id);

    // Add AI-suggested tags
    for (const tagName of classification.suggested_tags) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase
          .from("note_tags")
          .upsert(
            { note_id: id, tag_id: tag.id, is_ai_suggested: true },
            { onConflict: "note_id,tag_id" }
          );
      }
    }

    // Add AI-suggested categories
    for (const catName of classification.suggested_categories) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", catName)
        .is("user_id", null)
        .single();

      if (category) {
        await supabase
          .from("note_categories")
          .upsert(
            { note_id: id, category_id: category.id, is_ai_suggested: true },
            { onConflict: "note_id,category_id" }
          );
      }
    }

    return NextResponse.json({
      status: "ready",
      classification,
    });
  } catch (error) {
    // Mark as error if max attempts reached, otherwise keep as pending for retry
    const newAttempts = note.processing_attempts + 1;
    const newStatus = newAttempts >= MAX_PROCESSING_ATTEMPTS ? "error" : "pending";

    await supabase
      .from("notes")
      .update({ status: newStatus })
      .eq("id", id);

    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/notes/[id]/process/route.ts
git commit -m "feat: add AI processing endpoint with classification, embedding, and usage limits"
```

---

## Task 8: Trigger Processing After Note Creation

**Files:**
- Modify: `src/app/api/notes/route.ts`

- [ ] **Step 1: Update POST handler to always set pending status and return note**

In `src/app/api/notes/route.ts`, change the status logic in the POST handler. Currently it sets `status: 'ready'` for notes without a URL. Change it so ALL notes start as `pending` — the client will trigger processing:

Find this line in the POST handler:
```typescript
      status: noteData.source_url ? "pending" : "ready",
```

Replace with:
```typescript
      status: "pending",
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/notes/route.ts
git commit -m "feat: all new notes start as pending for AI processing"
```

---

## Task 9: Dashboard Processing Status + Auto-trigger

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add processing trigger to dashboard**

In `src/app/page.tsx`, add a useEffect that triggers processing for any pending notes. Add this after the existing `useEffect` blocks (before the `if (authLoading)` check):

```typescript
  // Auto-trigger processing for pending notes
  useEffect(() => {
    if (!notes.length) return;

    const pendingNotes = notes.filter((n) => n.status === "pending");
    for (const note of pendingNotes) {
      fetch(`/api/notes/${note.id}/process`, { method: "POST" })
        .then(() => fetchNotes())
        .catch(() => {}); // Silently retry on next poll
    }
  }, [notes, fetchNotes]);

  // Poll for processing updates every 5 seconds when there are processing notes
  useEffect(() => {
    const hasProcessing = notes.some(
      (n) => n.status === "pending" || n.status === "processing"
    );
    if (!hasProcessing) return;

    const interval = setInterval(fetchNotes, 5000);
    return () => clearInterval(interval);
  }, [notes, fetchNotes]);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: auto-trigger AI processing and poll for updates on dashboard"
```

---

## Task 10: AI Suggestions Review Component

**Files:**
- Create: `src/components/AiSuggestions.tsx`
- Modify: `src/components/NoteDetail.tsx`

- [ ] **Step 1: Create AiSuggestions component**

```tsx
// src/components/AiSuggestions.tsx
"use client";

import { useState } from "react";

interface AiSuggestionsProps {
  noteId: string;
  suggestedTags: { id: string; name: string; is_ai_suggested: boolean }[];
  suggestedCategories: {
    id: string;
    name: string;
    icon: string | null;
    is_ai_suggested: boolean;
  }[];
  onUpdate: () => void;
}

export function AiSuggestions({
  noteId,
  suggestedTags,
  suggestedCategories,
  onUpdate,
}: AiSuggestionsProps) {
  const aiTags = suggestedTags.filter((t) => t.is_ai_suggested);
  const aiCategories = suggestedCategories.filter((c) => c.is_ai_suggested);

  const [removedTags, setRemovedTags] = useState<Set<string>>(new Set());
  const [removedCategories, setRemovedCategories] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);

  if (aiTags.length === 0 && aiCategories.length === 0) return null;

  function toggleTag(id: string) {
    setRemovedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setRemovedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    const keepTags = suggestedTags
      .filter((t) => !removedTags.has(t.id))
      .map((t) => t.name);
    const keepCategories = suggestedCategories
      .filter((c) => !removedCategories.has(c.id))
      .map((c) => c.id);

    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: keepTags,
        category_ids: keepCategories,
      }),
    });

    setSaving(false);
    onUpdate();
  }

  return (
    <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
      <p className="text-sm font-medium text-brand">AI návrhy</p>

      {aiTags.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Navrhované štítky:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {aiTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  removedTags.has(tag.id)
                    ? "bg-gray-100 text-gray-400 line-through"
                    : "bg-brand/10 text-brand"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiCategories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Navrhované kategorie:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {aiCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  removedCategories.has(cat.id)
                    ? "bg-gray-100 text-gray-400 line-through"
                    : "bg-brand/10 text-brand"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? "Ukládám..." : "Potvrdit návrhy"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update NoteDetail to show AI suggestions**

In `src/components/NoteDetail.tsx`, add the AiSuggestions component. Add this import at the top:

```typescript
import { AiSuggestions } from "./AiSuggestions";
```

Then add a `onUpdate` prop to the NoteDetailProps interface and the component:

Change the interface:
```typescript
interface NoteDetailProps {
  note: { /* existing fields */ };
  onUpdate: () => void;
}
```

Add `onUpdate` to the destructured props:
```typescript
export function NoteDetail({ note, onUpdate }: NoteDetailProps) {
```

Add the AiSuggestions component after the categories/tags section (after the `</div>` that closes the flex flex-wrap gap-2 div):

```tsx
      {/* AI Suggestions */}
      <AiSuggestions
        noteId={note.id}
        suggestedTags={note.note_tags.map((nt) => ({
          id: nt.tags.id,
          name: nt.tags.name,
          is_ai_suggested: nt.is_ai_suggested ?? false,
        }))}
        suggestedCategories={note.note_categories.map((nc) => ({
          id: nc.categories.id,
          name: nc.categories.name,
          icon: nc.categories.icon,
          is_ai_suggested: nc.is_ai_suggested ?? false,
        }))}
        onUpdate={onUpdate}
      />
```

- [ ] **Step 3: Update note detail page to pass onUpdate**

In `src/app/notes/[id]/page.tsx`, update the `NoteDetail` usage to pass an `onUpdate` callback that refetches the note:

```tsx
  function refetchNote() {
    fetch(`/api/notes/${params.id}`)
      .then((r) => r.json())
      .then((data) => setNote(data));
  }

  // In the return:
  return <NoteDetail note={note} onUpdate={refetchNote} />;
```

- [ ] **Step 4: Update API to return is_ai_suggested in queries**

In `src/app/api/notes/[id]/route.ts`, update the GET query to include `is_ai_suggested`:

Change the select from:
```
note_tags(tag_id, tags(id, name)),
note_categories(category_id, categories(id, name, icon)),
```

To:
```
note_tags(tag_id, is_ai_suggested, tags(id, name)),
note_categories(category_id, is_ai_suggested, categories(id, name, icon)),
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AiSuggestions.tsx src/components/NoteDetail.tsx src/app/notes/[id]/page.tsx src/app/api/notes/[id]/route.ts
git commit -m "feat: add AI suggestions review component with approve/reject UI"
```

---

## Task 11: Build Verification

**Files:** None new — verification only

- [ ] **Step 1: Run tests**

```bash
npx vitest run
```
Expected: All tests pass

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: resolve Phase 2 build issues"
```

---

## Phase Summary

After completing Phase 2, you will have:
- ✅ Supabase project created with full database schema
- ✅ OpenAI integration (GPT-4o + text-embedding-3-small)
- ✅ Automatic content classification and metadata extraction
- ✅ Embedding generation for future semantic search
- ✅ URL content fetching with SSRF protection
- ✅ Freemium usage limit enforcement (50 AI requests/month free)
- ✅ AI suggestions review UI (approve/reject tags and categories)
- ✅ Auto-processing trigger on dashboard with polling

**Next phases:**
- Phase 3: Search (fulltext + semantic + hybrid ranking)
- Phase 4: Security Hardening (rate limiting, CSP headers, Turnstile, SSRF)
- Phase 5: PWA + Entry Points (Share Target, service worker, quick add)
- Phase 6: Export & Sharing (Markdown/JSON/PDF, shared links, collections)
- Phase 7: Chrome Extension
