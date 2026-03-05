import * as focusService from "../services/focus.service.js";

export const startFocus = async (req, res, next) => {
    try {
        const userId = req.userId;
        const session = await focusService.startFocusSession(userId);

        res.status(201).json({ data: session });
    } catch (err) {
        next(err);
    }
};

export const stopFocus = async (req, res, next) => {
    try {
        const userId = req.userId;
        const sessionId = req.params.id;

        const result = await focusService.stopFocusSession({ userId, sessionId });

        res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
};
