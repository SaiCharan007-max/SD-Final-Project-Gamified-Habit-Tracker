import pool from "../config/db.js";

export const createHabit = async ({ userId, name, frequency, target_count, current_streak, best_streak }) => {
    const result = await pool.query(
        `
            INSERT INTO habits (user_id, name, frequency, target_count, current_streak, best_streak)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `,
        [userId, name, frequency, target_count, current_streak, best_streak]
    );

    return result.rows[0] || null;
}

export const getHabits = async (userId) => {
    const result = await pool.query(
        `
            SELECT name, frequency, target_count, current_streak, best_streak, created_at
            FROM habits 
            WHERE user_id=$1;
        `,
        [userId]
    );

    return result.rows || null;
}

export const getHabitByUHId = async (userId, habitId) => {
    const result = await pool.query(
        `
            SELECT * FROM habits 
            WHERE id=$1 AND user_id=$2;
        `,
        [habitId, userId]
    );

    return result.rows[0] || null;
}

export const getHabitLogByHabitId = async (habitId) => {
    const result = await pool.query(
        `
            SELECT * FROM habit_logs
            WHERE habit_id=$1 AND completed_at=CURRENT_DATE;
        `,
        [habitId]
    );

    return result.rows[0] || null;
}

export const createHabitLog = async ({habitId, countDone}) => {
    const result = await pool.query(
        `
            INSERT INTO habit_logs (habit_id, count_done, completed_date)
            VALUES ($1, $2, CURRENT_DATE)
            RETURNING id, habit_id, count_done, completed_date;
        `,
        [habitId, countDone]
    );

    return result.rows[0] || null;
}

export const updateHabitLog = async ({habitId, count_done}) => {
    const result = await pool.query(
        `
            UPDATE habit_logs   
            SET count_done=$1
            WHERE habit_id=$2
            RETURNING *;
        `,
        [count_done, habitId]
    );

    return result.rows[0] || null;
}