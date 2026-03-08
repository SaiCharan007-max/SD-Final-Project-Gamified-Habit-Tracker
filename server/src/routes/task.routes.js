import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    createTask,
    getTasks,
    completeTask
} from "../controllers/task.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);
router.post("/complete/:id", authMiddleware, completeTask);

export default router;
