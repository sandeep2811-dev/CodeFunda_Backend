import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ── Configuration ─────────────────────────────────────────────────────────────
// Maximum violations before auto-disqualification
export const MAX_VIOLATIONS = 3;

/**
 * Compute total violation count for a user in a contest.
 * This is always server-side so it can't be tampered with.
 */
const getViolationCount = async (contestId, userId) => {
  return db.contestViolation.count({ where: { contestId, userId } });
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/contests/:id/violations
 * Log a single violation from the client.
 * Body: { type: string, description?: string }
 *
 * Returns:
 *  { totalViolations, remaining, disqualified, message }
 */
export const logViolation = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const userId    = req.user.id;
  const { type, description } = req.body;

  const ALLOWED_TYPES = [
    "TAB_SWITCH",
    "FULLSCREEN_EXIT",
    "COPY_PASTE",
    "KEYBOARD_SHORTCUT",
    "WEBCAM_OFF",
  ];

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}` });
  }

  // Ensure the contest exists
  const contest = await db.contest.findUnique({ where: { id: contestId } });
  if (!contest) return res.status(404).json({ error: "Contest not found" });

  // Check if user is already disqualified (pre-condition check).
  // We determine disqualification by the server-side count.
  const currentCount = await getViolationCount(contestId, userId);
  if (currentCount >= MAX_VIOLATIONS) {
    return res.status(200).json({
      totalViolations: currentCount,
      remaining:       0,
      disqualified:    true,
      message:         "User is already disqualified. No further logging needed.",
    });
  }

  // Record the violation
  await db.contestViolation.create({
    data: { contestId, userId, type, description: description ?? null },
  });

  const newCount   = currentCount + 1;
  const remaining  = Math.max(0, MAX_VIOLATIONS - newCount);
  const disqualified = newCount >= MAX_VIOLATIONS;

  // If just disqualified, update participant record so the leaderboard shows it
  if (disqualified) {
    // We don't delete the participant — instead we could add a `disqualified` flag.
    // For now we set problemsSolved = -1 as a sentinel so they sort to the bottom.
    await db.contestParticipant.upsert({
      where:  { contestId_userId: { contestId, userId } },
      update: { totalPenalty: 999999 }, // push to bottom of leaderboard
      create: { contestId, userId, totalPenalty: 999999 },
    });
  }

  res.status(200).json({
    totalViolations: newCount,
    remaining,
    disqualified,
    message: disqualified
      ? "You have been disqualified due to repeated suspicious activity."
      : `Warning: ${type} detected. You have ${remaining} warning${remaining !== 1 ? "s" : ""} remaining.`,
  });
});

/**
 * GET /api/v1/contests/:id/violations/me
 * Returns current user's violation summary for a contest.
 */
export const getMyViolations = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const userId    = req.user.id;

  const violations = await db.contestViolation.findMany({
    where:   { contestId, userId },
    orderBy: { createdAt: "asc" },
    select:  { id: true, type: true, description: true, createdAt: true },
  });

  const total        = violations.length;
  const remaining    = Math.max(0, MAX_VIOLATIONS - total);
  const disqualified = total >= MAX_VIOLATIONS;

  res.status(200).json({ success: true, violations, total, remaining, disqualified, maxAllowed: MAX_VIOLATIONS });
});

/**
 * GET /api/v1/contests/:id/violations  (admin only)
 * Returns ALL violations for a contest, grouped by user.
 */
export const getAllViolations = asyncHandler(async (req, res) => {
  const contestId = req.params.id;

  const violations = await db.contestViolation.findMany({
    where:   { contestId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Group by userId
  const byUser = violations.reduce((acc, v) => {
    const uid = v.userId;
    if (!acc[uid]) {
      acc[uid] = { user: v.user, violations: [], total: 0, disqualified: false };
    }
    acc[uid].violations.push({ id: v.id, type: v.type, description: v.description, createdAt: v.createdAt });
    acc[uid].total += 1;
    acc[uid].disqualified = acc[uid].total >= MAX_VIOLATIONS;
    return acc;
  }, {});

  res.status(200).json({
    success:     true,
    maxAllowed:  MAX_VIOLATIONS,
    users:       Object.values(byUser),
  });
});

/**
 * GET /api/v1/contests/:id/violations/status
 * Quick status check — is the current user disqualified?
 * Used by the frontend on mount to re-sync.
 */
export const getDisqualificationStatus = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const userId    = req.user.id;

  const total        = await getViolationCount(contestId, userId);
  const remaining    = Math.max(0, MAX_VIOLATIONS - total);
  const disqualified = total >= MAX_VIOLATIONS;

  res.status(200).json({ disqualified, total, remaining, maxAllowed: MAX_VIOLATIONS });
});
