import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import taskRoutes from "./routes/task.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import timetableRoutes from "./routes/timetable.routes.js";
import focusRoutes from "./routes/focus.routes.js";
import gamificationRoutes from "./routes/gamification.routes.js";
import puzzleRoutes from "./routes/puzzle.routes.js";

// Error handler
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "../../client");

// Parse JSON body
app.use(express.json());

// Enable CORS
app.use(cors());


// HTTP request logger (dev friendly)
app.use(morgan("dev"));


app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/puzzle", puzzleRoutes);

// Serve frontend files from /client so the project runs from one server process
app.use(express.static(clientDir));
app.get("/", (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

app.use(errorMiddleware);

export default app;
