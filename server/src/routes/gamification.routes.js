import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkAndAwardBadges, getMyBadges } from "../controllers/gamification.controller.js";

const router = express.Router();

router.get("/badges", authMiddleware, getMyBadges);
router.post("/badges/check", authMiddleware, checkAndAwardBadges);

export default router;
