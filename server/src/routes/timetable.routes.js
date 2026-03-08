import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    createSlot,
    getTimetable,
    deleteSlot
} from "../controllers/timetable.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createSlot);
router.get("/", authMiddleware, getTimetable);
router.delete("/:id", authMiddleware, deleteSlot);

export default router;

