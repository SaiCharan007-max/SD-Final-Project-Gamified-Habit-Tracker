import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { startFocus, stopFocus } from "../controllers/focus.controller.js";

const router = express.Router();

router.post("/start", authMiddleware, startFocus);
router.post("/stop/:id", authMiddleware, stopFocus);

export default router;
