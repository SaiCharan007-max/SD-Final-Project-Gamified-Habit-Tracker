import pool from "../config/db.js";
import { randomUUID } from "crypto";

export const getAllBadges = async () => {
    const result = await pool.query(
        `
        SELECT id, name, description, condition_type, condition_value, created_at
        FROM badges
        ORDER BY condition_value ASC, name ASC;
        `
    );

    return result.rows || [];
};

export const getUserBadgeRows = async (userId) => {
    const result = await pool.query(
        `
        SELECT ub.badge_id, ub.earned_at
        FROM user_badges ub
        WHERE ub.user_id = $1;
        `,
        [userId]
    );

    return result.rows || [];
};

export const awardUserBadge = async ({ userId, badgeId }) => {
    const existing = await pool.query(
        `
        SELECT id
        FROM user_badges
        WHERE user_id = $1 AND badge_id = $2
        LIMIT 1;
        `,
        [userId, badgeId]
    );

    if (existing.rows[0]) return null;

    const id = randomUUID();
    const result = await pool.query(
        `
        INSERT INTO user_badges (id, user_id, badge_id, earned_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, user_id, badge_id, earned_at;
        `,
        [id, userId, badgeId]
    );

    return result.rows[0] || null;
};

export const getUserCoreMetrics = async (userId) => {
    const result = await pool.query(
        `
        SELECT total_points, tasks_completed, habits_completed, current_login_streak
        FROM user_stats
        WHERE user_id = $1
        LIMIT 1;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const getBestHabitStreak = async (userId) => {
    const result = await pool.query(
        `
        SELECT COALESCE(MAX(best_streak), 0)::int AS best_habit_streak
        FROM habits
        WHERE user_id = $1;
        `,
        [userId]
    );

    return result.rows[0]?.best_habit_streak || 0;
};

export const getFocusMetrics = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            COUNT(*) FILTER (WHERE completed = true)::int AS focus_sessions_completed,
            COALESCE(MAX(duration_minutes) FILTER (WHERE completed = true), 0)::int AS long_focus_minutes
        FROM focus_sessions
        WHERE user_id = $1;
        `,
        [userId]
    );

    return result.rows[0] || { focus_sessions_completed: 0, long_focus_minutes: 0 };
};
