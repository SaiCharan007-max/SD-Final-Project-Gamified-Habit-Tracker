import express from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getLeaderboard);

export default router;
