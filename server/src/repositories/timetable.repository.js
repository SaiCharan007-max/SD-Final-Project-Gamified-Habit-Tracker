import pool from "../config/db.js";

export const createSlot = async ({ userId, day, title, start_time, end_time }) => {
    const result = await pool.query(
        `
        INSERT INTO timetable (user_id, day_of_week, title, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
        `,
        [userId, day, title, start_time, end_time]
    );

    return result.rows[0] || null;
};

export const getTimetable = async (userId) => {
    const result = await pool.query(
        `
        SELECT * FROM timetable
        WHERE user_id=$1
        ORDER BY day_of_week, start_time;
        `,
        [userId]
    );

    return result.rows;
};

export const deleteSlot = async ({ userId, slotId }) => {
    const result = await pool.query(
        `
        DELETE FROM timetable
        WHERE id=$1 AND user_id=$2
        RETURNING *;
        `,
        [slotId, userId]
    );

    return result.rows[0] || null;
};
