import pool from "../config/db.js";

export const createTask = async ({ userId, title, description, xp_reward }) => {
    const result = await pool.query(
        `
        INSERT INTO tasks (user_id, title, description, xp_reward, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *;
        `,
        [userId, title, description, xp_reward]
    );

    return result.rows[0] || null;
};

export const getTasksByUser = async (userId) => {
    const result = await pool.query(
        `
        SELECT id, title, description, xp_reward, status, created_at
        FROM tasks
        WHERE user_id = $1
        ORDER BY created_at DESC;
        `,
        [userId]
    );

    return result.rows;
};

export const getTaskById = async (taskId, userId) => {
    const result = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE id = $1 AND user_id = $2;
        `,
        [taskId, userId]
    );

    return result.rows[0] || null;
};

export const markTaskCompleted = async (taskId) => {
    const result = await pool.query(
        `
        UPDATE tasks
        SET status = 'completed'
        WHERE id = $1
        RETURNING *;
        `,
        [taskId]
    );

    return result.rows[0] || null;
};

export const updateUserStatsFromTask = async ({ userId, xp }) => {
    const result = await pool.query(
        `
        UPDATE user_stats
        SET 
            total_points = total_points + $1,
            tasks_completed = tasks_completed + 1,
            level = FLOOR((total_points + $1)/100) + 1
        WHERE user_id = $2
        RETURNING total_points, level;
        `,
        [xp, userId]
    );

    return result.rows[0] || null;
};
