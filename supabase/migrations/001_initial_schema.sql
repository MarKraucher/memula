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
    ('Technologie', '', '#6366f1', NULL),
    ('Vareni', '', '#ef4444', NULL),
    ('Vzdelavani', '', '#f59e0b', NULL),
    ('Cestovani', '', '#22c55e', NULL),
    ('Zdravi', '', '#ec4899', NULL),
    ('Finance', '', '#84cc16', NULL),
    ('Zabava', '', '#a855f7', NULL),
    ('Prace', '', '#3b82f6', NULL);
