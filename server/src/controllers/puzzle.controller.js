import * as puzzleService from "../services/puzzle.service.js";

export const getCurrentPuzzle = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await puzzleService.getCurrentPuzzle(userId);

        return res.status(200).json({
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const unlockPuzzleTile = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { tileIndex } = req.body || {};

        if (tileIndex !== undefined && !Number.isInteger(tileIndex)) {
            return res.status(400).json({
                message: "tileIndex must be an integer"
            });
        }

        const result = await puzzleService.unlockPuzzleTile({
            userId,
            tileIndex
        });

        return res.status(200).json({
            data: result
        });
    } catch (error) {
        next(error);
    }
};
