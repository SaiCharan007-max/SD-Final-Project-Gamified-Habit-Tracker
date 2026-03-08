import pool from "../config/db.js";

export const getTopUsers = async (limit = 20) => {
    const result = await pool.query(
        `
        SELECT 
            u.id,
            u.name,
            us.total_points,
            FLOOR(us.total_points / 100) + 1 AS level
        FROM user_stats us
        JOIN users u ON u.id = us.user_id
        ORDER BY us.total_points DESC
        LIMIT $1;
        `,
        [limit]
    );

    return result.rows;
};
