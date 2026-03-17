import axios from "axios";

// Using Piston API
const PISTON_API = process.env.PISTON_API_URL || "http://localhost:2000/api/v2";

/**
 * Map language names from your platform
 * to Piston runtime configuration
 */
export const getPistonLanguage = (language) => {
  if (!language) return null;
  const languageMap = {
    PYTHON: {
      language: "python",
      version: "3.10.0",
    },
    JAVA: {
      language: "java",
      version: "15.0.2",
    },
    JAVASCRIPT: {
      language: "javascript",
      version: "18.15.0",
    },
    CPP: {
      language: "c++",
      version: "10.2.0",
    },
    C: {
      language: "c",
      version: "10.2.0",
    },
    GO: {
      language: "go",
      version: "1.16.2",
    }
  };

  return languageMap[language.toUpperCase()];
};

/**
 * Execute code using Piston API
 */
export const executeCode = async ({ language, version, code, stdin }) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const { data } = await axios.post(
        `${PISTON_API}/execute`,
        {
          language,
          version,
          files: [
            {
              content: code,
            },
          ],
          stdin: stdin || "",
        },
        { timeout: 10000 } // 10 seconds timeout
      );

      // Distinguish compile error and run error
      if (data.compile && data.compile.code !== 0) {
        return {
          stdout: "",
          stderr: data.compile.stderr || data.compile.output,
          memory: 0,
          cpu_time: 0,
        };
      }

      return data.run;
    } catch (error) {
      if (retries === 1) {
        console.error("Piston Execution Error:", error?.response?.data || error.message);
        throw new Error("Code execution failed after multiple retries");
      }
      retries--;
      await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
    }
  }
};

/**
 * Utility function to get readable language name
 */
export const getLanguageName = (language) => {
  const LANGUAGE_NAMES = {
    python: "Python",
    javascript: "JavaScript",
    "c++": "C++",
    c: "C",
    java: "Java",
    go: "Go"
  };

  return LANGUAGE_NAMES[language] || "Unknown";
};

export const LANGUAGE_MAP = {
  71: {
    name: "PYTHON",
    piston: { language: "python", version: "3.10.0" }
  },
  63: {
    name: "JAVASCRIPT",
    piston: { language: "javascript", version: "18.15.0" }
  },
  62: {
    name: "JAVA",
    piston: { language: "java", version: "15.0.2" }
  },
  54: {
    name: "CPP",
    piston: { language: "c++", version: "10.2.0" }
  },
  50: {
    name: "C",
    piston: { language: "c", version: "10.2.0" }
  },
  60: {
    name: "GO",
    piston: { language: "go", version: "1.16.2" }
  }
};

/**
 * Convert language_id → readable name
 */
export const getLang = (language_id) => {
  return LANGUAGE_MAP[language_id]?.name || null;
};