import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/v1/leaderboard
 *
 * Returns users ranked by:
 *  1. problemsSolved (desc)
 *  2. earliest first solve time as tie-breaker (asc)
 *
 * Each entry includes: rank, userId, name, email, image, solvedCount, firstSolveAt
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  // Fetch users with their solved problems (including solve timestamps for tie-breaking)
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      problemSolved: {
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Build ranked list
  const ranked = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      solvedCount: user.problemSolved.length,
      // Earliest solve timestamp (for tie-breaking); null if no solves
      firstSolveAt: user.problemSolved[0]?.createdAt ?? null,
    }))
    // Sort: most solved first; if tied → earliest solver first
    .sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (!a.firstSolveAt) return 1;
      if (!b.firstSolveAt) return -1;
      return new Date(a.firstSolveAt) - new Date(b.firstSolveAt);
    })
    // Only top 100
    .slice(0, 100)
    // Add rank
    .map((user, idx) => ({ ...user, rank: idx + 1 }));

  res.status(200).json({
    success: true,
    message: "Leaderboard fetched successfully",
    leaderboard: ranked,
  });
});
