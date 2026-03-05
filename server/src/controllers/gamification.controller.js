import * as gamificationService from "../services/gamification.service.js";

export const getMyBadges = async (req, res, next) => {
    try {
        const userId = req.userId;
        const badges = await gamificationService.getUserBadges(userId);
        return res.status(200).json({ data: badges });
    } catch (err) {
        next(err);
    }
};

export const checkAndAwardBadges = async (req, res, next) => {
    try {
        const userId = req.userId;
        const awarded = await gamificationService.evaluateAndAwardBadges(userId);
        return res.status(200).json({ data: awarded });
    } catch (err) {
        next(err);
    }
};
