import pool from "../config/db.js";
import { randomUUID } from "crypto";

export const createHabit = async ({ userId, name, frequency, target_count, current_streak, best_streak }) => {
    const id = randomUUID();
    const result = await pool.query(
        `
        INSERT INTO habits (id, user_id, name, frequency, target_count, current_streak, best_streak)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        `,
        [id, userId, name, frequency, target_count, current_streak, best_streak]
    );

    return result.rows[0] || null;
};

export const getHabits = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            h.id,
            h.name,
            h.frequency,
            h.target_count,
            h.current_streak,
            h.best_streak,
            h.last_completed_date,
            h.created_at,
            COALESCE(hl.count_done, 0) AS today_count,
            (COALESCE(hl.count_done, 0) >= h.target_count) AS completed_today
        FROM habits h
        LEFT JOIN habit_logs hl
          ON hl.habit_id = h.id
         AND hl.completed_date = CURRENT_DATE
        WHERE h.user_id=$1;
        `,
        [userId]
    );

    return result.rows || [];
};

export const getHabitByUHId = async (userId, habitId) => {
    const result = await pool.query(
        `
        SELECT * FROM habits 
        WHERE id=$1 AND user_id=$2;
        `,
        [habitId, userId]
    );

    return result.rows[0] || null;
};

export const getHabitLogByHabitId = async (habitId) => {
    const result = await pool.query(
        `
        SELECT * FROM habit_logs
        WHERE habit_id=$1 AND completed_date=CURRENT_DATE;
        `,
        [habitId]
    );

    return result.rows[0] || null;
};

export const createHabitLog = async ({ habitId, countDone }) => {
    const id = randomUUID();
    const result = await pool.query(
        `
        INSERT INTO habit_logs (id, habit_id, count_done, completed_date)
        VALUES ($1, $2, $3, CURRENT_DATE)
        RETURNING *;
        `,
        [id, habitId, countDone]
    );

    return result.rows[0] || null;
};

export const updateHabitLog = async ({ habitId, count_done }) => {
    const result = await pool.query(
        `
        UPDATE habit_logs   
        SET count_done=$1
        WHERE habit_id=$2 AND completed_date=CURRENT_DATE
        RETURNING *;
        `,
        [count_done, habitId]
    );

    return result.rows[0] || null;
};

export const dateDifference = async (last_completed_date) => {
    const result = await pool.query(
        `
        SELECT CURRENT_DATE - $1 AS diff_days;
        `,
        [last_completed_date]
    );

    return result.rows[0];   // returns { diff_days: number }
};

export const updateHabit = async ({ id, current_streak, best_streak }) => {
    const result = await pool.query(
        `
        UPDATE habits 
        SET current_streak=$1, best_streak=$2, last_completed_date=CURRENT_DATE
        WHERE id=$3
        RETURNING *;
        `,
        [current_streak, best_streak, id]
    );

    return result.rows[0] || null;
};

export const updateUserStats = async ({ userId, xp }) => {
    const result = await pool.query(
        `   
        UPDATE user_stats
        SET total_points = total_points + $1,
            habits_completed = habits_completed + 1
        WHERE user_id = $2  
        RETURNING total_points;
        `,
        [xp, userId]
    );

    return result.rows[0] || null;
};
