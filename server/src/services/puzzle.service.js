import pool from "../config/db.js";
import AppError from "../utils/AppError.js";
import * as puzzleRepo from "../repositories/puzzle.repository.js";

const NO_IMAGE_MESSAGE = "No active puzzle image is available. Add rows to puzzle_images first.";

const normalizeTiles = (tiles) => {
    if (!Array.isArray(tiles)) return [];

    return [...new Set(
        tiles
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0)
    )].sort((a, b) => a - b);
};

const totalTilesForProgress = (progress) => {
    if (!progress) return 0;

    const rows = Number(progress.grid_rows || 0);
    const cols = Number(progress.grid_cols || 0);

    return rows > 0 && cols > 0 ? rows * cols : 0;
};

const normalizeDateValue = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
};

const buildPuzzlePayload = ({ state, progress, meta = {} }) => {
    const revealedTiles = normalizeTiles(progress?.revealed_tiles);
    const totalTiles = totalTilesForProgress(progress);
    const revealedCount = Number(progress?.revealed_count || 0);
    const tilesRemaining = Math.max(totalTiles - revealedCount, 0);
    const availableUnlocks = Number(state?.available_unlocks || 0);

    return {
        image: progress
            ? {
                id: progress.image_id,
                title: progress.title,
                image_path: progress.image_path,
                grid_rows: Number(progress.grid_rows || 0),
                grid_cols: Number(progress.grid_cols || 0),
                total_tiles: totalTiles
            }
            : null,
        progress: progress
            ? {
                progress_id: progress.id,
                revealed_tiles: revealedTiles,
                revealed_count: revealedCount,
                tiles_remaining: tilesRemaining,
                completion_percentage: totalTiles > 0
                    ? Math.round((revealedCount / totalTiles) * 100)
                    : 0,
                status: progress.status
            }
            : null,
        streak: {
            current: Number(state?.current_streak || 0),
            best: Number(state?.best_streak || 0),
            available_unlocks: availableUnlocks,
            can_unlock_now: availableUnlocks > 0 && !!progress,
            last_qualified_date: normalizeDateValue(state?.last_qualified_date),
            next_unlock_at_streak: progress ? revealedCount + availableUnlocks + 1 : null
        },
        message: progress ? null : NO_IMAGE_MESSAGE,
        ...meta
    };
};

const assignNextPuzzleImage = async (userId, client) => {
    const nextImage = await puzzleRepo.getRandomAvailableImageForUser(userId, client);
    if (!nextImage) return null;

    await puzzleRepo.createPuzzleProgress({
        userId,
        imageId: nextImage.id
    }, client);

    return await puzzleRepo.getActivePuzzleProgress(userId, client);
};

const ensurePuzzleSetup = async (userId, client) => {
    let state = await puzzleRepo.getUserPuzzleState(userId, client);
    if (!state) {
        state = await puzzleRepo.createUserPuzzleState({ userId }, client);
        if (!state) {
            state = await puzzleRepo.getUserPuzzleState(userId, client);
        }
    }

    if (!state) {
        throw new AppError("Failed to initialize puzzle state for the user", 500);
    }

    let progress = await puzzleRepo.getActivePuzzleProgress(userId, client);
    if (!progress) {
        progress = await assignNextPuzzleImage(userId, client);
    }

    return { state, progress };
};

export const initializePuzzleForUser = async (userId) => {
    const client = await pool.connect();

    try {
        const puzzle = await ensurePuzzleSetup(userId, client);
        return buildPuzzlePayload(puzzle);
    } finally {
        client.release();
    }
};

export const getCurrentPuzzle = async (userId) => {
    const client = await pool.connect();

    try {
        const puzzle = await ensurePuzzleSetup(userId, client);
        return buildPuzzlePayload(puzzle);
    } finally {
        client.release();
    }
};

export const recordDailyPuzzleProgress = async (userId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { state, progress } = await ensurePuzzleSetup(userId, client);

        let currentStreak = Number(state?.current_streak || 0);
        let bestStreak = Number(state?.best_streak || 0);
        let availableUnlocks = Number(state?.available_unlocks || 0);
        const lastQualifiedDate = state?.last_qualified_date || null;

        let qualifiedToday = false;
        let unlockEarnedToday = false;
        let streakReset = false;
        const today = await puzzleRepo.getCurrentDate(client);

        if (lastQualifiedDate) {
            const diffData = await puzzleRepo.getDateDifference(lastQualifiedDate, client);
            const diff = Number(diffData?.diff_days || 0);

            if (diff === 0) {
                await client.query("COMMIT");
                return buildPuzzlePayload({
                    state,
                    progress,
                    meta: {
                        qualified_today: true,
                        unlock_earned_today: false,
                        streak_reset: false
                    }
                });
            }

            if (diff === 1) {
                currentStreak += 1;
            } else {
                currentStreak = 1;
                availableUnlocks = 0;
                streakReset = true;
            }
        } else {
            currentStreak = 1;
        }

        qualifiedToday = true;
        bestStreak = Math.max(bestStreak, currentStreak);

        if (progress) {
            const totalTiles = totalTilesForProgress(progress);
            const revealedCount = Number(progress.revealed_count || 0);

            if (totalTiles > 0 && revealedCount < totalTiles) {
                const earnedThreshold = revealedCount + availableUnlocks;

                if (currentStreak > earnedThreshold) {
                    availableUnlocks += 1;
                    unlockEarnedToday = true;
                }
            }
        }

        const updatedState = await puzzleRepo.updateUserPuzzleState({
            userId,
            currentStreak,
            bestStreak,
            availableUnlocks,
            lastQualifiedDate: today
        }, client);

        if (!updatedState) {
            throw new AppError("Failed to update puzzle streak state", 500);
        }

        await client.query("COMMIT");

        return buildPuzzlePayload({
            state: updatedState,
            progress,
            meta: {
                qualified_today: qualifiedToday,
                unlock_earned_today: unlockEarnedToday,
                streak_reset: streakReset
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const unlockPuzzleTile = async ({ userId, tileIndex }) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { state, progress } = await ensurePuzzleSetup(userId, client);

        if (!progress) {
            throw new AppError(NO_IMAGE_MESSAGE, 404);
        }

        const totalTiles = totalTilesForProgress(progress);
        if (totalTiles <= 0) {
            throw new AppError("Puzzle grid is invalid for the active image", 500);
        }

        const availableUnlocks = Number(state?.available_unlocks || 0);
        if (availableUnlocks <= 0) {
            throw new AppError("No tile unlock is available right now", 409);
        }

        const revealedTiles = normalizeTiles(progress.revealed_tiles);

        if (revealedTiles.length >= totalTiles) {
            throw new AppError("This puzzle is already complete", 409);
        }

        const remainingTiles = [];
        for (let index = 0; index < totalTiles; index += 1) {
            if (!revealedTiles.includes(index)) {
                remainingTiles.push(index);
            }
        }

        let selectedTile = tileIndex;

        if (selectedTile === undefined || selectedTile === null) {
            selectedTile = remainingTiles[Math.floor(Math.random() * remainingTiles.length)];
        }

        if (!Number.isInteger(selectedTile) || selectedTile < 0 || selectedTile >= totalTiles) {
            throw new AppError(`tileIndex must be an integer between 0 and ${totalTiles - 1}`, 400);
        }

        if (revealedTiles.includes(selectedTile)) {
            throw new AppError("That tile is already unlocked", 409);
        }

        const updatedTiles = [...revealedTiles, selectedTile].sort((a, b) => a - b);
        const updatedProgress = await puzzleRepo.updatePuzzleProgress({
            progressId: progress.id,
            revealedTiles: updatedTiles,
            revealedCount: updatedTiles.length
        }, client);

        if (!updatedProgress) {
            throw new AppError("Failed to update puzzle progress", 500);
        }

        const updatedState = await puzzleRepo.updateUserPuzzleState({
            userId,
            currentStreak: Number(state.current_streak || 0),
            bestStreak: Number(state.best_streak || 0),
            availableUnlocks: availableUnlocks - 1,
            lastQualifiedDate: state.last_qualified_date || null
        }, client);

        if (!updatedState) {
            throw new AppError("Failed to update available puzzle unlocks", 500);
        }

        let activeProgress = updatedProgress;
        let completedImage = null;
        let nextImageAssigned = false;

        if (updatedTiles.length === totalTiles) {
            await puzzleRepo.completePuzzleProgress(progress.id, client);
            completedImage = {
                id: progress.image_id,
                title: progress.title,
                image_path: progress.image_path
            };
            activeProgress = await assignNextPuzzleImage(userId, client);
            nextImageAssigned = !!activeProgress;
        }

        await client.query("COMMIT");

        return buildPuzzlePayload({
            state: updatedState,
            progress: activeProgress,
            meta: {
                unlocked_tile: selectedTile,
                unlocked_on_image_id: progress.image_id,
                image_completed: !!completedImage,
                completed_image: completedImage,
                next_image_assigned: nextImageAssigned
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
