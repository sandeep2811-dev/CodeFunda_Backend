import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const getContestStatus = (startTime, endTime) => {
  const now = new Date();
  if (now < new Date(startTime)) return "upcoming";
  if (now > new Date(endTime))   return "ended";
  return "live";
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/contests  (admin only)
 * Create a new contest.
 */
export const createContest = asyncHandler(async (req, res) => {
  const { title, description, startTime, endTime, problemIds = [] } = req.body;
  const userId = req.user.id;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: "title, startTime, and endTime are required" });
  }
  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ error: "startTime must be before endTime" });
  }

  const contest = await db.contest.create({
    data: {
      title,
      description,
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
      createdBy: userId,
      problems: {
        create: problemIds.map((problemId, idx) => ({
          problemId,
          order: idx,
        })),
      },
    },
    include: {
      problems: { include: { problem: { select: { id: true, title: true, difficulty: true } } } },
    },
  });

  res.status(201).json({ success: true, message: "Contest created successfully", contest });
});

/**
 * GET /api/v1/contests
 * List all contests with status annotation.
 */
export const getContests = asyncHandler(async (req, res) => {
  const contests = await db.contest.findMany({
    orderBy: { startTime: "asc" },
    include: {
      _count: { select: { participants: true, problems: true } },
      problems: {
        orderBy: { order: "asc" },
        include: { problem: { select: { id: true, title: true, difficulty: true } } },
      },
    },
  });

  const annotated = contests.map((c) => ({
    ...c,
    status: getContestStatus(c.startTime, c.endTime),
  }));

  res.status(200).json({ success: true, contests: annotated });
});

/**
 * GET /api/v1/contests/:id
 * Get a single contest with leaderboard info.
 */
export const getContest = asyncHandler(async (req, res) => {
  const contest = await db.contest.findUnique({
    where: { id: req.params.id },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: { problem: { select: { id: true, title: true, difficulty: true, tags: true } } },
      },
      participants: {
        orderBy: [{ problemsSolved: "desc" }, { totalPenalty: "asc" }],
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { participants: true } },
    },
  });

  if (!contest) return res.status(404).json({ error: "Contest not found" });

  // Is the requesting user already a participant?
  const joined = contest.participants.some((p) => p.userId === req.user.id);

  // Rank participants
  const rankedParticipants = contest.participants.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  res.status(200).json({
    success: true,
    contest: {
      ...contest,
      status: getContestStatus(contest.startTime, contest.endTime),
      participants: rankedParticipants,
      joined,
    },
  });
});

/**
 * POST /api/v1/contests/:id/join
 * Join a contest. Only allowed when the contest is upcoming or live.
 */
export const joinContest = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const userId    = req.user.id;

  const contest = await db.contest.findUnique({ where: { id: contestId } });
  if (!contest) return res.status(404).json({ error: "Contest not found" });

  const status = getContestStatus(contest.startTime, contest.endTime);
  if (status === "ended") {
    return res.status(400).json({ error: "This contest has already ended" });
  }

  const participant = await db.contestParticipant.upsert({
    where:  { contestId_userId: { contestId, userId } },
    update: {},
    create: { contestId, userId },
  });

  res.status(200).json({ success: true, message: "Joined contest successfully", participant });
});

/**
 * GET /api/v1/contests/:id/leaderboard
 * Returns contest leaderboard sorted by problemsSolved desc, totalPenalty asc.
 */
export const getContestLeaderboard = asyncHandler(async (req, res) => {
  const participants = await db.contestParticipant.findMany({
    where: { contestId: req.params.id },
    orderBy: [{ problemsSolved: "desc" }, { totalPenalty: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const ranked = participants.map((p, idx) => ({
    rank:          idx + 1,
    userId:        p.userId,
    name:          p.user.name,
    email:         p.user.email,
    image:         p.user.image,
    problemsSolved: p.problemsSolved,
    totalPenalty:  p.totalPenalty,
    joinedAt:      p.joinedAt,
  }));

  res.status(200).json({ success: true, leaderboard: ranked });
});

/**
 * POST /api/v1/contests/:id/submit
 * Record a contest submission (called AFTER the normal execute-code endpoint succeeds).
 * If Accepted, increments problemsSolved. Wrong Answer adds a 20-minute penalty.
 */
export const submitContestSolution = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const userId    = req.user.id;
  const { problemId, status } = req.body;

  if (!problemId || !status) {
    return res.status(400).json({ error: "problemId and status are required" });
  }

  const contest = await db.contest.findUnique({ where: { id: contestId } });
  if (!contest) return res.status(404).json({ error: "Contest not found" });

  const contestStatus = getContestStatus(contest.startTime, contest.endTime);
  if (contestStatus !== "live") {
    return res.status(400).json({ error: "Submissions are only allowed during a live contest" });
  }

  // Ensure participant
  await db.contestParticipant.upsert({
    where:  { contestId_userId: { contestId, userId } },
    update: {},
    create: { contestId, userId },
  });

  const isAccepted = status === "Accepted";
  const PENALTY_WRONG = 20; // 20 minute penalty per wrong submission

  // Check if this problem was already solved
  const alreadySolved = await db.contestSubmission.findFirst({
    where: { contestId, userId, problemId, status: "Accepted" },
  });

  // Record submission
  await db.contestSubmission.create({
    data: {
      contestId,
      userId,
      problemId,
      status,
      penalty: isAccepted || alreadySolved ? 0 : PENALTY_WRONG,
    },
  });

  // Update participant stats (only if not already solved)
  if (isAccepted && !alreadySolved) {
    // Calculate time-based penalty (minutes from contest start to this submission)
    const minutesElapsed = Math.floor(
      (new Date() - new Date(contest.startTime)) / 60000
    );
    // Wrong-answer penalty: count prior wrong attempts for this problem
    const wrongAttempts = await db.contestSubmission.count({
      where: { contestId, userId, problemId, status: "Wrong Answer" },
    });
    const penaltyToAdd = minutesElapsed + wrongAttempts * PENALTY_WRONG;

    await db.contestParticipant.update({
      where: { contestId_userId: { contestId, userId } },
      data: {
        problemsSolved: { increment: 1 },
        totalPenalty:   { increment: penaltyToAdd },
      },
    });
  } else if (!isAccepted && !alreadySolved) {
    await db.contestParticipant.update({
      where: { contestId_userId: { contestId, userId } },
      data:  { totalPenalty: { increment: PENALTY_WRONG } },
    });
  }

  res.status(200).json({ success: true, message: `Contest submission recorded: ${status}` });
});

/**
 * POST /api/v1/contests/:id/problems  (admin only)
 * Add one or more existing problems to a contest.
 * Body: { problemIds: string[] }
 */
export const addProblemsToContest = asyncHandler(async (req, res) => {
  const contestId  = req.params.id;
  const { problemIds } = req.body;

  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return res.status(400).json({ error: "problemIds must be a non-empty array" });
  }

  const contest = await db.contest.findUnique({ where: { id: contestId } });
  if (!contest) return res.status(404).json({ error: "Contest not found" });

  // Get current max order so new problems are appended
  const existing = await db.contestProblem.findMany({
    where:   { contestId },
    orderBy: { order: "desc" },
    take:    1,
  });
  const baseOrder = (existing[0]?.order ?? -1) + 1;

  // createMany with skipDuplicates so re-adding an existing problem is a no-op
  await db.contestProblem.createMany({
    data: problemIds.map((problemId, idx) => ({
      contestId,
      problemId,
      order: baseOrder + idx,
    })),
    skipDuplicates: true,
  });

  // Return the updated contest
  const updated = await db.contest.findUnique({
    where:   { id: contestId },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: { problem: { select: { id: true, title: true, difficulty: true } } },
      },
    },
  });

  res.status(200).json({ success: true, message: "Problems added to contest", contest: updated });
});

/**
 * DELETE /api/v1/contests/:id/problems/:problemId  (admin only)
 * Remove a problem from a contest.
 */
export const removeProblemFromContest = asyncHandler(async (req, res) => {
  const { id: contestId, problemId } = req.params;

  await db.contestProblem.deleteMany({ where: { contestId, problemId } });

  res.status(200).json({ success: true, message: "Problem removed from contest" });
});

