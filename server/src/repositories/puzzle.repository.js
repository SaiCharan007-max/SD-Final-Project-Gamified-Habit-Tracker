import { randomUUID } from "crypto";
import pool from "../config/db.js";

const getDb = (client) => client ?? pool;

export const getUserPuzzleState = async (userId, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        SELECT user_id, current_streak, best_streak, available_unlocks, last_qualified_date, created_at, updated_at
        FROM user_puzzle_state
        WHERE user_id = $1;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const createUserPuzzleState = async ({ userId }, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        INSERT INTO user_puzzle_state (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING user_id, current_streak, best_streak, available_unlocks, last_qualified_date, created_at, updated_at;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const updateUserPuzzleState = async (
    { userId, currentStreak, bestStreak, availableUnlocks, lastQualifiedDate },
    client
) => {
    const db = getDb(client);
    const result = await db.query(
        `
        UPDATE user_puzzle_state
        SET current_streak = $1,
            best_streak = $2,
            available_unlocks = $3,
            last_qualified_date = $4,
            updated_at = NOW()
        WHERE user_id = $5
        RETURNING user_id, current_streak, best_streak, available_unlocks, last_qualified_date, created_at, updated_at;
        `,
        [currentStreak, bestStreak, availableUnlocks, lastQualifiedDate, userId]
    );

    return result.rows[0] || null;
};

export const getDateDifference = async (targetDate, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        SELECT CURRENT_DATE - $1::date AS diff_days;
        `,
        [targetDate]
    );

    return result.rows[0] || null;
};

export const getCurrentDate = async (client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        SELECT CURRENT_DATE::text AS today;
        `
    );

    return result.rows[0]?.today || null;
};

export const getActivePuzzleProgress = async (userId, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        SELECT
            upp.id,
            upp.user_id,
            upp.image_id,
            upp.revealed_tiles,
            upp.revealed_count,
            upp.status,
            upp.assigned_at,
            upp.completed_at,
            pi.title,
            pi.image_path,
            pi.grid_rows,
            pi.grid_cols,
            pi.is_active,
            pi.created_at AS image_created_at
        FROM user_puzzle_progress upp
        JOIN puzzle_images pi
          ON pi.id = upp.image_id
        WHERE upp.user_id = $1
          AND upp.status = 'active'
        LIMIT 1;
        `,
        [userId]
    );

    return result.rows[0] || null;
};

export const getRandomAvailableImageForUser = async (userId, client) => {
    const db = getDb(client);

    const unseenResult = await db.query(
        `
        SELECT id, title, image_path, grid_rows, grid_cols, is_active, created_at
        FROM puzzle_images pi
        WHERE pi.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM user_puzzle_progress upp
              WHERE upp.user_id = $1
                AND upp.image_id = pi.id
          )
        ORDER BY RANDOM()
        LIMIT 1;
        `,
        [userId]
    );

    if (unseenResult.rows[0]) {
        return unseenResult.rows[0];
    }

    const fallbackResult = await db.query(
        `
        SELECT id, title, image_path, grid_rows, grid_cols, is_active, created_at
        FROM puzzle_images
        WHERE is_active = TRUE
        ORDER BY RANDOM()
        LIMIT 1;
        `
    );

    return fallbackResult.rows[0] || null;
};

export const createPuzzleProgress = async ({ userId, imageId }, client) => {
    const db = getDb(client);
    const id = randomUUID();

    const result = await db.query(
        `
        INSERT INTO user_puzzle_progress (id, user_id, image_id, revealed_tiles, revealed_count, status)
        VALUES ($1, $2, $3, '[]'::jsonb, 0, 'active')
        RETURNING id, user_id, image_id, revealed_tiles, revealed_count, status, assigned_at, completed_at;
        `,
        [id, userId, imageId]
    );

    return result.rows[0] || null;
};

export const updatePuzzleProgress = async ({ progressId, revealedTiles, revealedCount }, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        UPDATE user_puzzle_progress
        SET revealed_tiles = $1::jsonb,
            revealed_count = $2
        WHERE id = $3
        RETURNING id, user_id, image_id, revealed_tiles, revealed_count, status, assigned_at, completed_at;
        `,
        [JSON.stringify(revealedTiles), revealedCount, progressId]
    );

    return result.rows[0] || null;
};

export const completePuzzleProgress = async (progressId, client) => {
    const db = getDb(client);
    const result = await db.query(
        `
        UPDATE user_puzzle_progress
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, image_id, revealed_tiles, revealed_count, status, assigned_at, completed_at;
        `,
        [progressId]
    );

    return result.rows[0] || null;
};
