const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const adminAuthController = require("./admin-auth.controller");
const {
  loginSchema,
  signupSchema
} = require("./admin-auth.validation");

const router = express.Router();

// Admin login route.
// POST /api/auth/login
// POST /api/admin/auth/login
router.post(
  "/login",
  validate(loginSchema),
  adminAuthController.login
);

// Admin signup route.
// This preserves the old administrator signup behavior.
router.post(
  "/signup",
  validate(signupSchema),
  adminAuthController.signup
);

module.exports = router;
