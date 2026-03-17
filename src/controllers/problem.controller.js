import { db } from "../libs/db.js";
import { getPistonLanguage, executeCode } from "../libs/piston.lib.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createProblem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
    const pistonLang = getPistonLanguage(language);
    console.log("-------------------", pistonLang);

    if (!pistonLang) {
      return res
        .status(400)
        .json({ error: `Language ${language} is not supported` });
    }

    for (let i = 0; i < testcases.length; i++) {
      const { input, output } = testcases[i];

      if (pistonLang.language == "java") continue;

      console.log("input ", input, "    output ", output, solutionCode, pistonLang)

      const result = await executeCode({
        language: pistonLang.language,
        version: pistonLang.version,
        code: solutionCode,
        stdin: input,
      });

      console.log("result---->", result)

      if (result.stderr) {
        return res.status(400).json({
          error: `Runtime error in ${language}`,
          details: result.stderr,
        });
      }

      if (result.stdout?.trim() !== output.trim()) {
        console.log("res--->", result.stdout, "     ", output)
        return res.status(400).json({
          error: `Testcase ${i + 1} failed for ${language}`,
        });
      }
    }
  }

  const newProblem = await db.problem.create({
    data: {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testcases,
      codeSnippets,
      referenceSolutions,
      userId: req.user.id,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Problem Created Successfully",
    problem: newProblem,
  });
});

export const getAllProblems = asyncHandler(async (req, res) => {
  const problems = await db.problem.findMany({
    include: {
      solvedBy: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  if (!problems) {
    return res.status(404).json({
      error: "No problems Found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Problems fetched successfully",
    problems,
  });
});

export const getProblemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await db.problem.findUnique({
    where: { id },
  });

  if (!problem) {
    return res.status(404).json({ error: "Problem not found." });
  }

  return res.status(200).json({
    success: true,
    message: "Problem fetched successfully",
    problem,
  });
});

export const updateProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingProblem = await db.problem.findUnique({
    where: { id },
  });

  if (!existingProblem) {
    return res.status(404).json({
      error: "Problem not found",
    });
  }

  const updatedProblem = await db.problem.update({
    where: { id },
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: "Problem Updated Successfully",
    problem: updatedProblem,
  });
});

export const deleteProblem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = await db.problem.findUnique({ where: { id } });

  if (!problem) {
    return res.status(404).json({ error: "Problem Not found" });
  }

  await db.problem.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: "Problem deleted Successfully",
  });
});

export const getAllProblemsSolvedByUser = asyncHandler(async (req, res) => {
  const problems = await db.problem.findMany({
    where: {
      solvedBy: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      solvedBy: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Problems fetched successfully",
    problems,
  });
});