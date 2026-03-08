import AppError from "../utils/AppError.js";
import * as badgeRepo from "../repositories/badge.repository.js";

const qualifies = ({ condition_type, condition_value }, metrics) => {
    const required = Number(condition_value || 0);

    switch (condition_type) {
        case "total_points":
            return (metrics.total_points || 0) >= required;
        case "tasks_completed":
            return (metrics.tasks_completed || 0) >= required;
        case "habits_completed":
            return (metrics.habits_completed || 0) >= required;
        case "best_habit_streak":
            return (metrics.best_habit_streak || 0) >= required;
        case "focus_sessions_completed":
            return (metrics.focus_sessions_completed || 0) >= required;
        case "long_focus_minutes":
            return (metrics.long_focus_minutes || 0) >= required;
        default:
            return false;
    }
};

export const getBadgeMetrics = async (userId) => {
    const core = await badgeRepo.getUserCoreMetrics(userId);
    if (!core) throw new AppError("User stats not found", 404);

    const [bestHabitStreak, focusMetrics] = await Promise.all([
        badgeRepo.getBestHabitStreak(userId),
        badgeRepo.getFocusMetrics(userId)
    ]);

    return {
        ...core,
        best_habit_streak: bestHabitStreak,
        focus_sessions_completed: focusMetrics.focus_sessions_completed || 0,
        long_focus_minutes: focusMetrics.long_focus_minutes || 0
    };
};

export const evaluateAndAwardBadges = async (userId) => {
    const [badges, earnedRows, metrics] = await Promise.all([
        badgeRepo.getAllBadges(),
        badgeRepo.getUserBadgeRows(userId),
        getBadgeMetrics(userId)
    ]);

    const earnedSet = new Set(earnedRows.map((r) => r.badge_id));
    const newlyAwarded = [];

    for (const badge of badges) {
        if (earnedSet.has(badge.id)) continue;
        if (!qualifies(badge, metrics)) continue;

        const granted = await badgeRepo.awardUserBadge({ userId, badgeId: badge.id });
        if (granted) {
            newlyAwarded.push({
                id: badge.id,
                name: badge.name,
                description: badge.description,
                condition_type: badge.condition_type,
                condition_value: badge.condition_value,
                earned_at: granted.earned_at
            });
        }
    }

    return newlyAwarded;
};

export const getUserBadges = async (userId) => {
    const [badges, earnedRows] = await Promise.all([
        badgeRepo.getAllBadges(),
        badgeRepo.getUserBadgeRows(userId)
    ]);

    const earnedMap = new Map(earnedRows.map((row) => [row.badge_id, row.earned_at]));

    return badges.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        condition_type: badge.condition_type,
        condition_value: badge.condition_value,
        earned: earnedMap.has(badge.id),
        earned_at: earnedMap.get(badge.id) || null
    }));
};
