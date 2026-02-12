import AppError from "../utils/AppError.js";
import * as repoHabit from "../repositories/habit.repository.js";

export const createHabit = async ({ userId, name, frequency, target_count }) => {
    const allowedFreq = ["daily", "weekly"];

    if (!allowedFreq.includes(frequency))
        throw new AppError("Invalid Frequency", 400);

    return await repoHabit.createHabit({
        userId,
        name,
        frequency,
        target_count,
        current_streak: 0,
        best_streak: 0
    });
};

export const getHabits = async (userId) => {
    return await repoHabit.getHabits(userId);
};

export const completeHabit = async ({ userId, habitId }) => {
    const habit = await repoHabit.getHabitByUHId(userId, habitId);

    if (!habit)
        throw new AppError("Habit not found", 404);

    const habitLog = await repoHabit.getHabitLogByHabitId(habitId);

    // First log of today
    if (!habitLog) {
        return await repoHabit.createHabitLog({ habitId, countDone: 1 });
    }

    // Already completed today
    if (habitLog.count_done >= habit.target_count)
        throw new AppError("Habit already completed for today", 409);

    const updatedLog = await repoHabit.updateHabitLog({
        habitId,
        count_done: habitLog.count_done + 1
    });

    // If fully completed → update streak + XP
    if (updatedLog.count_done === habit.target_count) {
        const gamification = await updateStreakandXP({ userId, habit });
        return { ...updatedLog, ...gamification };
    }

    return updatedLog;
};

const updateStreakandXP = async ({ userId, habit }) => {
    const {
        id,
        last_completed_date,
        current_streak,
        best_streak,
        frequency,
        target_count
    } = habit;

    let newStreak = 1;
    let newBestStreak = best_streak;

    // First ever completion
    if (!last_completed_date) {
        newStreak = 1;
        newBestStreak = 1;
    } else {
        const diffObj = await repoHabit.dateDifference(last_completed_date);
        const diff = diffObj.diff_days;   // extract number

        if (frequency === "weekly") {
            newStreak = diff <= 7 ? current_streak + 1 : 1;
        } else {
            newStreak = diff === 1 ? current_streak + 1 : 1;
        }

        newBestStreak = Math.max(newBestStreak, newStreak);
    }

    // Update habit streak
    await repoHabit.updateHabit({
        id,
        current_streak: newStreak,
        best_streak: newBestStreak
    });

    // XP using NEW streak
    const xpCalculated = 10 + newStreak * 2 + target_count;

    const updatedStats = await repoHabit.updateUserStats({
        userId,
        xp: xpCalculated
    });

    return {
        xp_gained: xpCalculated,
        current_streak: newStreak,
        best_streak: newBestStreak,
        total_points: updatedStats.total_points,
        level: updatedStats.level
    };
};
