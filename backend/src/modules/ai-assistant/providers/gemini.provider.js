const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateAnswer = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(prompt);

  const response = result.response;

  const text = response.text();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text.trim();
};

module.exports = {
  generateAnswer,
};