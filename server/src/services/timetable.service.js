import AppError from "../utils/AppError.js";
import * as repoTime from "../repositories/timetable.repository.js";

export const addSlot = async (data) => {
    const normalizedDay = Number(data.day);

    if (!Number.isInteger(normalizedDay) || normalizedDay < 0 || normalizedDay > 6)
        throw new AppError("Invalid day_of_week", 400);

    return await repoTime.createSlot({
        ...data,
        day: normalizedDay
    });
};

export const getSchedule = async (userId) => {
    return await repoTime.getTimetable(userId);
};

export const removeSlot = async ({ userId, slotId }) => {
    const deleted = await repoTime.deleteSlot({ userId, slotId });

    if (!deleted)
        throw new AppError("Slot not found", 404);

    return deleted;
};
