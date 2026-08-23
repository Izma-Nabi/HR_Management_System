const { GoogleGenerativeAI } = require("@google/generative-ai");

const env = require("../../../../../global/env");

// ============================================================
// ASK GEMINI
// ============================================================

const askGemini = async ({
  systemPrompt,
  question,
}) => {
  // ----------------------------------------------------------
  // Get API key
  // ----------------------------------------------------------

  const apiKey = env.geminiApiKey;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  // ----------------------------------------------------------
  // Create Gemini client
  // ----------------------------------------------------------

  const genAI = new GoogleGenerativeAI(
    apiKey.trim()
  );

  // ----------------------------------------------------------
  // Gemini model
  // ----------------------------------------------------------

  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
  });

  // ----------------------------------------------------------
  // Build prompt
  // ----------------------------------------------------------

  const prompt = `
${systemPrompt}

==================================================
EMPLOYEE QUESTION
==================================================

${question}

==================================================
INSTRUCTIONS
==================================================

Answer the employee's question using ONLY the
information provided in the system context.

Do not invent information.

Do not expose database IDs.

Do not expose private information about other employees.

If the requested information is not available,
clearly tell the employee that the information
is not available.

Keep the answer concise, clear, and professional.

If the employee asks about attendance lateness,
explain the lateness using the configured office
hours and actual check-in time.

If the employee asks about leave balances,
use the calculated values provided by the backend.

If the employee asks about Team Leads, only use
Team Leads belonging to the employee's department.

If the employee asks which HR to contact, use only
the HR contacts provided in the context.
`;

  // ----------------------------------------------------------
  // Send request to Gemini
  // ----------------------------------------------------------

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],

    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1200,
    },
  });

  // ----------------------------------------------------------
  // Extract response
  // ----------------------------------------------------------

  const response = result.response;

  if (!response) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  const answer = response.text();

  if (!answer || !answer.trim()) {
    throw new Error(
      "Gemini returned an empty answer."
    );
  }

  return answer.trim();
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  askGemini,
};
