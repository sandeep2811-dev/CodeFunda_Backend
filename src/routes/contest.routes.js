import express from "express";
import {
  createContest,
  getContests,
  getContest,
  joinContest,
  getContestLeaderboard,
  submitContestSolution,
  addProblemsToContest,
  removeProblemFromContest,
} from "../controllers/contest.controller.js";
import { authMiddleware, checkAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All contest routes require authentication
router.use(authMiddleware);

// ── Public (authenticated user) ──────────────────────────────────────────────
router.get("/",                    getContests);              // list all
router.get("/:id",                 getContest);               // single contest + participants
router.get("/:id/leaderboard",     getContestLeaderboard);    // contest leaderboard
router.post("/:id/join",           joinContest);              // join a contest
router.post("/:id/submit",         submitContestSolution);    // record contest submission

// ── Admin only ────────────────────────────────────────────────────────────────
router.post("/",                              checkAdmin, createContest);           // create contest
router.post("/:id/problems",                  checkAdmin, addProblemsToContest);    // add problems
router.delete("/:id/problems/:problemId",     checkAdmin, removeProblemFromContest); // remove problem

export default router;
