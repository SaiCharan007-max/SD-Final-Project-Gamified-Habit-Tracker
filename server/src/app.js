import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import authRoutes from "./routes/auth.routes.js";
// import taskRoutes from "./routes/task.routes.js";
// import habitRoutes from "./routes/habit.routes.js";
// import leaderboardRoutes from "./routes/leaderboard.routes.js";

// Error handler
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Parse JSON body
app.use(express.json());

// Enable CORS
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: false
    }
));

// HTTP request logger (dev friendly)
app.use(morgan("dev"));


app.use("/api/auth", authRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/habits", habitRoutes);
// app.use("/api/leaderboard", leaderboardRoutes);


app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use(errorMiddleware);

export default app;
