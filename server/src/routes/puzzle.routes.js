import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getCurrentPuzzle, unlockPuzzleTile } from "../controllers/puzzle.controller.js";

const router = express.Router();

router.get("/current", authMiddleware, getCurrentPuzzle);
router.post("/unlock", authMiddleware, unlockPuzzleTile);

export default router;
