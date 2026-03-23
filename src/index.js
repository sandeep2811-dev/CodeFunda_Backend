import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executionRoute from "./routes/executeCode.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import contestRoutes from "./routes/contest.routes.js";
import violationRoutes from "./routes/violation.routes.js";
import helmet from "helmet";
import { morganMiddleware } from "./middleware/logger.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morganMiddleware);
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.send("Hello Guys welcome to CodeFunda 🔥");
});

app.use("/api/v1/auth",         authRoutes);
app.use("/api/v1/problems",     problemRoutes);
app.use("/api/v1/execute-code", executionRoute);
app.use("/api/v1/submission",   submissionRoutes);
app.use("/api/v1/playlist",     playlistRoutes);
app.use("/api/v1/leaderboard",  leaderboardRoutes);
app.use("/api/v1/contests",     contestRoutes);
// Violation routes nested: /api/v1/contests/:id/violations
app.use("/api/v1/contests/:id/violations", violationRoutes);

// Centralized error handler (must be last)
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

