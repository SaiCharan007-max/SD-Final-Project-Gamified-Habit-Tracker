CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS puzzle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_path TEXT NOT NULL UNIQUE,
    grid_rows INTEGER NOT NULL DEFAULT 5 CHECK (grid_rows > 0),
    grid_cols INTEGER NOT NULL DEFAULT 5 CHECK (grid_cols > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_puzzle_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES puzzle_images(id) ON DELETE RESTRICT,
    revealed_tiles JSONB NOT NULL DEFAULT '[]'::jsonb,
    revealed_count INTEGER NOT NULL DEFAULT 0 CHECK (revealed_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_puzzle_progress_active_unique
ON user_puzzle_progress (user_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_puzzle_progress_user_id
ON user_puzzle_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_puzzle_images_active
ON puzzle_images (is_active);

CREATE TABLE IF NOT EXISTS user_puzzle_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
    available_unlocks INTEGER NOT NULL DEFAULT 0 CHECK (available_unlocks >= 0),
    last_qualified_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sample image seed rows.
-- Replace the image_path values with the real paths or URLs you will use in the frontend.
-- INSERT INTO puzzle_images (title, image_path, grid_rows, grid_cols)
-- VALUES
--     ('Aurora Lake', '/puzzle-images/aurora-lake.jpg', 5, 5),
--     ('Mountain Sunrise', '/puzzle-images/mountain-sunrise.jpg', 5, 5),
--     ('City Nights', '/puzzle-images/city-nights.jpg', 5, 5);
