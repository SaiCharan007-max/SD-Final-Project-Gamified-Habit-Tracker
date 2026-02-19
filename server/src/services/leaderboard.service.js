import * as leaderboardRepo from "../repositories/leaderboard.repository.js";

export const getLeaderboard = async () => {
    const users = await leaderboardRepo.getTopUsers(20);

    // Add rank
    const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        name: user.name,
        total_points: user.total_points,
        level: user.level
    }));

    return leaderboard;
};
