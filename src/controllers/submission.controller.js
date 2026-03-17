import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllSubmission = asyncHandler(async (req, res) => {
  const submissions = await db.submission.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Submissions fetched successfully",
    submissions,
  });
});

export const getSubmissionsForProblem = asyncHandler(async (req, res) => {
  const submissions = await db.submission.findMany({
    where: {
      userId: req.user.id,
      problemId: req.params.problemId,
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    message: "Submission fetched successfully",
    submissions,
  });
});

export const getAllTheSubmissionsForProblem = asyncHandler(async (req, res) => {
  const count = await db.submission.count({
    where: {
      problemId: req.params.problemId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Submissions fetched successfully",
    count,
  });
});