const axios = require("axios");

const generateAnswer = async (prompt) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const answer =
    response.data?.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return answer.trim();
};

module.exports = {
  generateAnswer,
};