import * as serviceHabit from "../services/habit.service.js";

export const createHabit = async (req, res, next) => {
    try {
        const { name, frequency, target_count } = req.body;
        const userId = req.userId;


        if (!name || name.trim() === "")
            return res.status(400).json({ message: "Habit Name cannot be empty" });


        if (!frequency || frequency.trim() === "")
            return res.status(400).json({ message: "Frequency required" });

        if (typeof target_count !== "number" && target_count > 0)
            return res.status(400).json({ message: "Invalid target_count" });

        const result = await serviceHabit.createHabit({
            userId, name, frequency, target_count
        });

        return res.status(200).json({
            data: result
        });
    } catch (err) {
        next(err);
    }
}

export const getHabits = async (req, res, next) => {

    try {
        const userId = req.userId;

        const result = await serviceHabit.getHabits(userId);

        return res.status(200).json({
            data: result
        });
    } catch (err) {
        next(err);
    }
}

export const completeHabit = async (req, res, next) => {
    try {
        
        const userId = req.userId;
        const habitId = req.params.id;

        if(!habitId)
            return res.status(400).json({ message: "Habit ID is required" });

        const result = await serviceHabit.completeHabit({ userId, habitId });

        return res.status(200).json({
            data: result
        });

    } catch (err) {
        next(err);
    }
}