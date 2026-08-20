const env = require("../../../../../global/env");

const askOpenRouter = async ({
  systemPrompt,
  question,
}) => {
  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured."
    );
  }

  const model =
    env.openRouterModel ||
    "openrouter/auto";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: question,
          },
        ],

        // IMPORTANT
        max_tokens: 1200,

        temperature: 0.2,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "OpenRouter request failed."
    );
  }

  return (
    data?.choices?.[0]?.message?.content ||
    "I could not generate an answer."
  );
};

module.exports = {
  askOpenRouter,
};