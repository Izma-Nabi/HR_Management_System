const path = require("path");
const dotenv = require("dotenv");

// dotenv reads global/.env and places those values into process.env.
// process.env is Node.js' global object for environment variables.
dotenv.config({
  path: path.join(__dirname, ".env")
});

// The Prisma schema lives in Bookme.pk/database while npm dependencies live in
// Bookme.pk/backend. This prevents Prisma from auto-creating a root package.
process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL =
  process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL || "1";

// This helper keeps environment validation simple and readable.
// If a required variable is missing, the app fails early during startup.
const required = (name) => {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

// Convert an environment variable to a number with a fallback value.
// Environment variables are always strings, so numeric config needs parsing.
const numberFromEnv = (name, fallback) => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === "") {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsedValue;
};

// Export one typed config object so the rest of the app does not read
// process.env directly. This makes config easier to find and maintain.
module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: numberFromEnv("PORT", 5000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  },
  bcrypt: {
    saltRounds: numberFromEnv("BCRYPT_SALT_ROUNDS", 12)
  },
  database: {
    // Prisma reads this same DATABASE_URL to connect to MySQL.
    // Example: mysql://root:password@127.0.0.1:3306/hr_management_system
    url: required("DATABASE_URL")
  }
};
