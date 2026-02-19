import pool from "../config/db.js";

export const createFocusSession = async ({ userId }) => {
    const result = await pool.query(
        `
        INSERT INTO focus_sessions (user_id, start_time)
        VALUES ($1, NOW())
        RETURNING *;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const getActiveSession = async (userId) => {
    const result = await pool.query(
        `
        SELECT * FROM focus_sessions
        WHERE user_id=$1 AND completed=false
        ORDER BY start_time DESC
        LIMIT 1;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const endFocusSession = async ({ sessionId }) => {
    const result = await pool.query(
        `
        UPDATE focus_sessions
        SET 
            end_time = NOW(),
            duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_time))/60,
            completed = true
        WHERE id=$1
        RETURNING *;
        `,
        [sessionId]
    );

    return result.rows[0] || null;
};

export const addXPForFocus = async ({ userId, xp }) => {
    const result = await pool.query(
        `
        UPDATE user_stats
        SET 
            total_points = total_points + $1,
            level = FLOOR((total_points + $1)/100) + 1
        WHERE user_id=$2
        RETURNING total_points, level;
        `,
        [xp, userId]
    );

    return result.rows[0] || null;
};