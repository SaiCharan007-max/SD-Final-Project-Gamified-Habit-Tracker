import AppError from "../utils/AppError.js";
import * as taskRepo from "../repositories/task.repository.js";

export const createTask = async ({ userId, title, description, xp_reward }) => {
    if (!title || title.trim() === "")
        throw new AppError("Task title required", 400);

    return await taskRepo.createTask({ userId, title, description, xp_reward });
};

export const getTasks = async (userId) => {
    return await taskRepo.getTasksByUser(userId);
};

export const completeTask = async ({ userId, taskId }) => {
    const task = await taskRepo.getTaskById(taskId, userId);

    if (!task)
        throw new AppError("Task not found", 404);

    if (task.status === "completed")
        throw new AppError("Task already completed", 409);

    const completedTask = await taskRepo.markTaskCompleted(taskId);

    const updatedStats = await taskRepo.updateUserStatsFromTask({
        userId,
        xp: task.xp_reward
    });

    return {
        task: completedTask,
        xp_gained: task.xp_reward,
        total_points: updatedStats.total_points,
        level: updatedStats.level
    };
};
