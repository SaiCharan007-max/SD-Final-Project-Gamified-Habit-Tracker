import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createHabit, getHabits, completeHabit} from "../controllers/habit.controller.js";    

const router = express.Router();
router.post("/create", authMiddleware, createHabit);
router.get("/", authMiddleware, getHabits);
router.post("/complete/:id", authMiddleware, completeHabit);
// router.get("/history/:id", authMiddleware, getHabitHistory);

export default router;