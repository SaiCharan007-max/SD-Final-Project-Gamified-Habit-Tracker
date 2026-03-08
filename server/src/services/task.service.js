import AppError from "../utils/AppError.js";
import * as taskRepo from "../repositories/task.repository.js";
import { evaluateAndAwardBadges } from "./gamification.service.js";

export const createTask = async ({ userId, title, description, priority, due_date }) => {
    if (!title || title.trim() === "")
        throw new AppError("Task title required", 400);

    const normalizedPriority = (priority || "low").toLowerCase();

    const priorityMap = {
        low: 1,
        medium: 2,
        high: 3
    };

    if (!priorityMap[normalizedPriority])
        throw new AppError("Invalid priority. Use low, medium, or high", 400);

    if (due_date && Number.isNaN(Date.parse(due_date)))
        throw new AppError("Invalid due_date format", 400);

    return await taskRepo.createTask({
        userId,
        title,
        description,
        priority: priorityMap[normalizedPriority],
        due_date
    });
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

    const xpMap = {
        1: 5,
        2: 10,
        3: 20
    };

    const xp = xpMap[task.priority] || 5;

    const completedTask = await taskRepo.markTaskCompleted(taskId);

    const updatedStats = await taskRepo.updateUserStatsFromTask({
        userId,
        xp
    });
    const newBadges = await evaluateAndAwardBadges(userId);

    const level = Math.floor((updatedStats.total_points || 0) / 100) + 1;

    return {
        task: completedTask,
        xp_gained: xp,
        total_points: updatedStats.total_points,
        level,
        new_badges: newBadges
    };
};
