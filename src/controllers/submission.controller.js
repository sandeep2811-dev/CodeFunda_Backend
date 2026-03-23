import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/v1/submission/get-all-submissions
 * Returns all submissions for the logged-in user including problem title & difficulty.
 */
export const getAllSubmission = asyncHandler(async (req, res) => {
  const submissions = await db.submission.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      problem: {
        select: { id: true, title: true, difficulty: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Submissions fetched successfully",
    submissions,
  });
});

/**
 * GET /api/v1/submission/get-submission/:problemId
 * Returns all submissions for the logged-in user on a specific problem,
 * including per-submission test case results.
 */
export const getSubmissionsForProblem = asyncHandler(async (req, res) => {
  const submissions = await db.submission.findMany({
    where: {
      userId:    req.user.id,
      problemId: req.params.problemId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      testCases: { orderBy: { testCase: "asc" } },
    },
  });

  res.status(200).json({
    success: true,
    message: "Submission fetched successfully",
    submissions,
  });
});

/**
 * GET /api/v1/submission/get-submissions-count/:problemId
 * Returns the total number of submissions for a problem across all users.
 */
export const getAllTheSubmissionsForProblem = asyncHandler(async (req, res) => {
  const count = await db.submission.count({
    where: { problemId: req.params.problemId },
  });

  res.status(200).json({
    success: true,
    message: "Submissions count fetched successfully",
    count,
  });
});