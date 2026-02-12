import pool from "../config/db.js";

export const createUserStats = async (obj) => {
    const result = await pool.query(
        `
            INSERT INTO user_stats (user_id, total_points, tasks_completed, habits_completed, current_login_streak)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, total_points, tasks_completed, habits_completed, current_login_streak
        `,
        [obj.userId, obj.total_points, obj.tasks_completed, obj.habits_completed, obj.current_login_streak]
    )

    return result.rows[0] || null;
}
