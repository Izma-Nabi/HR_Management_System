const {
  askQuestion,
} = require("./ai-assistant.service");

const askAssistant = async (req, res, next) => {
  try {
    console.log("AI Assistant request body:", req.body);
    console.log("AI Assistant user:", req.user);

    const userId = Number(req.user.id);
    const { question } = req.body || {};

    console.log("AI Assistant question:", question);

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authenticated user not found.",
        errors: [],
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Question is required.",
        errors: [],
      });
    }

    const data = await askQuestion(userId, question);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "AI response generated successfully.",
      data,
      errors: [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askAssistant,
};