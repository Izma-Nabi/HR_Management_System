const express = require("express");
const router = express.Router();

const aiAssistantController = require("./ai-assistant.controller");

// Use your existing authentication middleware here
const authMiddleware = require("../../middlewares/auth.middleware");

router.post(
  "/ask",
  authMiddleware,
  aiAssistantController.askAssistant
);

module.exports = router;