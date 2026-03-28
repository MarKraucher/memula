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
