import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getLeaderboard = asyncHandler(async (req, res) => {
    const leaderboard = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            _count: {
                select: { problemSolved: true }
            }
        },
        orderBy: {
            problemSolved: {
                _count: 'desc'
            }
        },
        take: 100
    });

    const formattedLeaderboard = leaderboard.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        solvedCount: user._count.problemSolved
    }));

    res.status(200).json({
        success: true,
        message: "Leaderboard fetched successfully",
        leaderboard: formattedLeaderboard,
    });
});
