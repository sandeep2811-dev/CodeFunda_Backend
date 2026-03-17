import { db } from "../libs/db.js";
import { executeCode, getLang, getPistonLanguage } from "../libs/piston.lib.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const executeCodeController = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expected_outputs, problemId } =
    req.body;

  const userId = req.user.id;

  if (
    !Array.isArray(stdin) ||
    !Array.isArray(expected_outputs) ||
    stdin.length !== expected_outputs.length
  ) {
    return res.status(400).json({ error: "Invalid testcases" });
  }

  const pistonLang = getPistonLanguage(getLang(language_id));
  const language = getLang(language_id)

  if (!pistonLang) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  let allPassed = true;

  const detailedResults = [];

  for (let i = 0; i < stdin.length; i++) {
    const result = await executeCode({
      language: pistonLang.language,
      version: pistonLang.version,
      code: source_code,
      stdin: stdin[i],
    });

    const stdout = result.stdout?.trim();
    const expected = expected_outputs[i]?.trim();

    const passed = stdout === expected;

    if (!passed) allPassed = false;

    detailedResults.push({
      testCase: i + 1,
      passed,
      stdout,
      expected,
      stderr: result.stderr,
      memory: result.memory,
      time: result.cpu_time,
    });
  }

  const submission = await db.submission.create({
    data: {
      userId,
      problemId,
      sourceCode: source_code,
      language,
      status: allPassed ? "Accepted" : "Wrong Answer",
    },
  });

  res.status(200).json({
    success: true,
    status: allPassed ? "Accepted" : "Wrong Answer",
    results: detailedResults,
    submission,
  });
});