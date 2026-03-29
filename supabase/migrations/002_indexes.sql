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
