import { db } from "../libs/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  const playList = await db.playlist.create({
    data: {
      name,
      description,
      userId,
    },
  });
  res.status(200).json({
    success: true,
    message: "Playlist created successfully",
    playList,
  });
});

export const getPlayAllListDetails = asyncHandler(async (req, res) => {
  const playLists = await db.playlist.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
  });
  res.status(200).json({
    success: true,
    message: "Playlist fetched successfully",
    playLists,
  });
});

export const getPlayListDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playList = await db.playlist.findUnique({
    where: { id: playlistId, userId: req.user.id },
    include: {
      problems: {
        include: {
          problem: true,
        },
      },
    },
  });

  if (!playList) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  res.status(200).json({
    success: true,
    message: "Playlist fetched successfully",
    playList,
  });
});

export const addProblemToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body; // Accept an array of problem IDs

  // Ensure problemIds is an array
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return res.status(400).json({ error: "Invalid or missing problemIds" });
  }

  console.log(
    problemIds.map((problemId) => ({
      playlistId,
      problemId,
    }))
  );

  // Create records for each problem in the playlist
  const problemsInPlaylist = await db.problemInPlaylist.createMany({
    data: problemIds.map((problemId) => ({
      playListId: playlistId, // ✅ match your Prisma field name exactly
      problemId,
    })),
  });

  res.status(201).json({
    success: true,
    message: "Problems added to playlist successfully",
    problemsInPlaylist,
  });
});

export const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const deletedPlaylist = await db.playlist.delete({
    where: {
      id: playlistId,
    },
  });

  res.status(200).json({
    success: true,
    message: "Playlist deleted successfully",
    deletedPlaylist,
  });
});

export const removeProblemFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { problemIds } = req.body;

  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return res.status(400).json({ error: "Invalid or missing problemIds" });
  }
  // Only delete given problemIds not all

  const deletedProblem = await db.problemInPlaylist.deleteMany({
    where: {
      playListId: playlistId,
      problemId: {
        in: problemIds,
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Problem removed from playlist successfully",
    deletedProblem,
  });
});
