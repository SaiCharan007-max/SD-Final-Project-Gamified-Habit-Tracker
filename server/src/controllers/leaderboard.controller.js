import * as leaderboardService from "../services/leaderboard.service.js";

export const getLeaderboard = async (req, res, next) => {
    try {
        const leaderboard = await leaderboardService.getLeaderboard();

        return res.status(200).json({
            data: leaderboard
        });
    } catch (err) {
        next(err);
    }
};
