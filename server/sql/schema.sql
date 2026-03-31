-- HabitQuest PostgreSQL schema (pgAdmin-ready)
-- Run this file first, then run sql/seed_badges.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    tasks_completed INTEGER NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
    habits_completed INTEGER NOT NULL DEFAULT 0 CHECK (habits_completed >= 0),
    current_login_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_login_streak >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority IN (1, 2, 3)),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    target_count INTEGER NOT NULL CHECK (target_count > 0),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
    last_completed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    count_done INTEGER NOT NULL DEFAULT 0 CHECK (count_done >= 0),
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, completed_date)
);

CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    title VARCHAR(200) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes NUMERIC(10, 2),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    condition_type VARCHAR(50) NOT NULL,
    condition_value INTEGER NOT NULL CHECK (condition_value >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_created_at ON tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_timetable_user_day_start ON timetable(user_id, day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_completed ON focus_sessions(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
