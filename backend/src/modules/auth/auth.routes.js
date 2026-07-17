const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const authController = require("./auth.controller");
const {
  loginSchema,
  signupSchema
} = require("./auth.validation");

const router = express.Router();

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get(
  "/me",
  authMiddleware,
  authController.me
);

router.post(
  "/signup",
  validate(signupSchema),
  authController.signup
);

router.post(
  "/logout",
  authMiddleware,
  authController.logout
);

module.exports = router;
