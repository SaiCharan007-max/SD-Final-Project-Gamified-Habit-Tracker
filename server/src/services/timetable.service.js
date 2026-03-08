import AppError from "../utils/AppError.js";
import * as repoTime from "../repositories/timetable.repository.js";

export const addSlot = async (data) => {
    if (data.day < 0 || data.day > 6)
        throw new AppError("Invalid day_of_week", 400);

    return await repoTime.createSlot(data);
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
