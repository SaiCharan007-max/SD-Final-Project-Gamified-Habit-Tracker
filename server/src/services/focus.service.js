import AppError from "../utils/AppError.js";
import * as repoFocus from "../repositories/focus.repository.js";
import { evaluateAndAwardBadges } from "./gamification.service.js";

export const startFocusSession = async (userId) => {
    const active = await repoFocus.getActiveSession(userId);

    if (active)
        throw new AppError("Focus session already running", 409);

    return await repoFocus.createFocusSession({ userId });
};

export const stopFocusSession = async ({ userId, sessionId }) => {
    const session = await repoFocus.endFocusSession({ userId, sessionId });

    if (!session)
        throw new AppError("Session not found or already completed", 404);

    const duration = Math.floor(session.duration_minutes);

    if (duration < 5)
        return { message: "Session too short. No XP awarded", duration };

    const xp = duration * 2;

    const stats = await repoFocus.addXPForFocus({ userId, xp });
    if (!stats)
        throw new AppError("User stats not found", 404);
    const newBadges = await evaluateAndAwardBadges(userId);
    const level = Math.floor((stats.total_points || 0) / 100) + 1;

    return {
        duration,
        xp_gained: xp,
        total_points: stats.total_points,
        level,
        new_badges: newBadges
    };
};
