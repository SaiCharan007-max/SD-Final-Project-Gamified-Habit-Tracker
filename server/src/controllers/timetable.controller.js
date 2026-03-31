import * as timetableService from "../services/timetable.service.js";

export const createSlot = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { day_of_week, title, start_time, end_time } = req.body;

        const slot = await timetableService.addSlot({
            userId,
            day: day_of_week,
            title,
            start_time,
            end_time
        });

        res.status(201).json({ data: slot });
    } catch (err) {
        next(err);
    }
};

export const getTimetable = async (req, res, next) => {
    try {
        const userId = req.userId;
        const schedule = await timetableService.getSchedule(userId);

        res.status(200).json({ data: schedule });
    } catch (err) {
        next(err);
    }
};

export const deleteSlot = async (req, res, next) => {
    try {
        const userId = req.userId;
        const slotId = req.params.id;

        const deleted = await timetableService.removeSlot({ userId, slotId });

        res.status(200).json({ data: deleted });
    } catch (err) {
        next(err);
    }
};
