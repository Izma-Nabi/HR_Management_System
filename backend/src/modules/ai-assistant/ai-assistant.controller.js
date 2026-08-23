const {
  askQuestion,
} = require("./ai-assistant.service");

const {
  askHRQuestion,
} = require("./hr_ai_assistant.service");

// ============================================================
// HELPERS
// ============================================================

const normalizeValue = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, " ");
};

const isHRUser = (user) => {
  if (!user) {
    return false;
  }

  // ----------------------------------------------------------
  // PRIMARY RULE:
  // Human Resources department gets HR AI
  // ----------------------------------------------------------

  const departmentName =
    user.department?.departmentName ||
    user.departmentName ||
    "";

  const normalizedDepartment =
    normalizeValue(departmentName);

  if (
    normalizedDepartment === "HUMAN RESOURCES" ||
    normalizedDepartment === "HR"
  ) {
    return true;
  }

  // ----------------------------------------------------------
  // SECONDARY RULE:
  // HR-related designation
  // ----------------------------------------------------------

  const designation =
    user.designation ||
    user.designationName ||
    "";

  const normalizedDesignation =
    normalizeValue(designation);

  if (
    normalizedDesignation === "HR" ||
    normalizedDesignation.includes("HR ") ||
    normalizedDesignation.startsWith("HR") ||
    normalizedDesignation.includes(" HUMAN RESOURCES") ||
    normalizedDesignation.startsWith("HUMAN RESOURCES")
  ) {
    return true;
  }

  return false;
};

// ============================================================
// CONTROLLER
// ============================================================

const askAssistant = async (req, res, next) => {
  try {
    console.log(
      "AI Assistant request body:",
      req.body
    );

    console.log(
      "AI Assistant user:",
      req.user
    );

    const userId = Number(req.user.id);

    const { question } = req.body || {};

    console.log(
      "AI Assistant question:",
      question
    );

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message:
          "Authenticated user not found.",
        errors: [],
      });
    }

    // ========================================================
    // QUESTION VALIDATION
    // ========================================================

    if (
      !question ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message:
          "Question is required.",
        errors: [],
      });
    }

    // ========================================================
    // DETERMINE AI TYPE
    // ========================================================

    const hrUser = isHRUser(req.user);

    console.log(
      "HR user:",
      hrUser
    );

    console.log(
      "User department:",
      req.user.department?.departmentName
    );

    console.log(
      "User designation:",
      req.user.designation
    );

    // ========================================================
    // HR AI
    // ========================================================

    if (hrUser) {
      console.log(
        "Using HR AI Assistant"
      );

      const data =
        await askHRQuestion(
          userId,
          question
        );

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message:
          "HR AI response generated successfully.",
        data,
        errors: [],
      });
    }

    // ========================================================
    // EMPLOYEE AI
    // ========================================================

    console.log(
      "Using Employee AI Assistant"
    );

    const data =
      await askQuestion(
        userId,
        question
      );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message:
        "AI response generated successfully.",
      data,
      errors: [],
    });
  } catch (error) {
    console.error(
      "AI Assistant Controller Error:",
      error
    );

    next(error);
  }
};

module.exports = {
  askAssistant,
};