import { db } from "../libs/db.js";
import { executeCode, getLang, getPistonLanguage } from "../libs/piston.lib.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/execute-code
 *
 * Executes source code against all test cases using Piston.
 * Fixes:
 *  - Saves TestCaseResult rows to DB (was missing before)
 *  - Upserts ProblemSolved when all tests pass (was missing before)
 *  - Returns { total, passed, failed, results, submission }
 */
export const executeCodeController = asyncHandler(async (req, res) => {
  const { source_code, language_id, stdin, expected_outputs, problemId } = req.body;
  const userId = req.user.id;

  // ── Validate input ────────────────────────────────────────────────────────
  if (
    !Array.isArray(stdin) ||
    !Array.isArray(expected_outputs) ||
    stdin.length !== expected_outputs.length
  ) {
    return res.status(400).json({ error: "Invalid testcases: stdin and expected_outputs must be equal-length arrays" });
  }

  const language = getLang(language_id);
  const pistonLang = getPistonLanguage(language);

  if (!pistonLang) {
    return res.status(400).json({ error: `Unsupported language_id: ${language_id}` });
  }

  // ── Run each test case against Piston ─────────────────────────────────────
  let allPassed = true;
  const detailedResults = [];

  for (let i = 0; i < stdin.length; i++) {
    const result = await executeCode({
      language: pistonLang.language,
      version:  pistonLang.version,
      code:     source_code,
      stdin:    stdin[i],
    });

    const stdout   = result.stdout?.trim() ?? "";
    const expected = expected_outputs[i]?.trim() ?? "";
    const passed   = stdout === expected;

    if (!passed) allPassed = false;

    detailedResults.push({
      testCase:      i + 1,
      passed,
      stdout,
      expected,
      stderr:        result.stderr  ?? null,
      compileOutput: result.compile?.output ?? null,
      memory:        result.memory  ?? null,
      time:          result.cpu_time ?? null,
    });
  }

  const total  = detailedResults.length;
  const passed = detailedResults.filter((r) => r.passed).length;
  const failed = total - passed;

  // ── Persist to DB in a transaction ───────────────────────────────────────
  const submission = await db.$transaction(async (tx) => {
    // 1. Create Submission record
    const sub = await tx.submission.create({
      data: {
        userId,
        problemId,
        sourceCode: source_code,
        language,
        status:     allPassed ? "Accepted" : "Wrong Answer",
        // Store memory & time as JSON arrays for history
        memory: JSON.stringify(detailedResults.map((r) => r.memory ?? "0")),
        time:   JSON.stringify(detailedResults.map((r) => r.time   ?? "0")),
      },
    });

    // 2. Save individual TestCaseResult rows (was missing before!)
    if (detailedResults.length > 0) {
      await tx.testCaseResult.createMany({
        data: detailedResults.map((r) => ({
          submissionId:  sub.id,
          testCase:      r.testCase,
          passed:        r.passed,
          stdout:        r.stdout         ?? null,
          expected:      r.expected,
          stderr:        r.stderr         ?? null,
          compileOutput: r.compileOutput  ?? null,
          status:        r.passed ? "Accepted" : "Wrong Answer",
          memory:        r.memory?.toString() ?? null,
          time:          r.time?.toString()   ?? null,
        })),
      });
    }

    // 3. If all tests passed → upsert ProblemSolved (was missing before!)
    if (allPassed) {
      await tx.problemSolved.upsert({
        where:  { userId_problemId: { userId, problemId } },
        update: {},      // already solved – don't duplicate
        create: { userId, problemId },
      });
    }

    // Return submission with its test case results included
    return tx.submission.findUnique({
      where: { id: sub.id },
      include: { testCases: { orderBy: { testCase: "asc" } } },
    });
  });

  // ── Response ──────────────────────────────────────────────────────────────
  res.status(200).json({
    success: true,
    total,
    passed,
    failed,
    status:     allPassed ? "Accepted" : "Wrong Answer",
    results:    detailedResults,
    submission,
  });
});