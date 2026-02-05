import AppError from "../utils/AppError.js";
import * as repoHabit from "../repositories/habit.repository.js";

export const createHabit = async ({ userId, name, frequency, target_count }) => {
    const allowedFreq = ["daily", "weekly"];

    if (!allowedFreq.includes(frequency))
        throw new AppError("Invalid Frequency", 400);

    const result = await repoHabit.createHabit({ userId, name, frequency, target_count, current_streak: 0, best_streak: 0 });

    return result;
}

export const getHabits = async (userId) => {
    const result = await repoHabit.getHabits(userId);
    return result;
}

export const completeHabit = async ({ userId, habitId }) => {


    const habit = await repoHabit.getHabitByUHId(userId, habitId);
    // getHabitByUHId means check for the habit in the users habits not others

    if (!habit)
        throw new AppError("Habit not found", 404);

    const habitLog = await repoHabit.getHabitLogByHabitId(habitId);

    if (!habitLog) {
        const createdHabitLog = await repoHabit.createHabitLog({habitId, countDone: 1});
        return createdHabitLog;
    }

    if(habitLog.count_done >= habit.target_count)
        throw new AppError("Habit already completed for today", 409);

    const result = await repoHabit.updateHabitLog({habitId, count_done: (habitLog.count_done+1)});

    // if(result.count_done === habit.target_count) {
    //     var updatedUserStatsHabitStats = await updateStreakandXP({userId, habitId, habit});

    // }
    //will complete that in later commits

    return result;
}

// const updateStreakandXP = async ({userId, habitId, habit}) => {
    
// }