import * as taskService from "../services/task.service.js";

export const createTask = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { title, description, xp_reward } = req.body;

        const task = await taskService.createTask({
            userId,
            title,
            description,
            xp_reward
        });

        return res.status(201).json({ data: task });
    } catch (err) {
        next(err);
    }
};

export const getTasks = async (req, res, next) => {
    try {
        const userId = req.userId;
        const tasks = await taskService.getTasks(userId);

        return res.status(200).json({ data: tasks });
    } catch (err) {
        next(err);
    }
};

export const completeTask = async (req, res, next) => {
    try {
        const userId = req.userId;
        const taskId = req.params.id;

        const result = await taskService.completeTask({ userId, taskId });

        return res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
};
