const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, ".env")
});

process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL =
  process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL || "1";

const required = (name) => {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
};

const numberFromEnv = (name, fallback) => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    throw new Error(
      `Environment variable ${name} must be a number`
    );
  }

  return parsedValue;
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: numberFromEnv("PORT", 5000),

  corsOrigin:
    process.env.CORS_ORIGIN ||
    "http://localhost:3000",

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn:
      process.env.JWT_EXPIRES_IN || "1d"
  },

  bcrypt: {
    saltRounds:
      numberFromEnv(
        "BCRYPT_SALT_ROUNDS",
        12
      )
  },

  database: {
    url: required("DATABASE_URL")
  },

  // ==========================================
  // AI CONFIGURATION
  // ==========================================

  geminiApiKey:
    process.env.GEMINI_API_KEY || "",

  openRouterApiKey:
    process.env.OPENROUTER_API_KEY || "",

  aiProvider:
    process.env.AI_PROVIDER || "auto",

  openRouterModel:
    process.env.OPENROUTER_MODEL ||
    "openrouter/auto"
};