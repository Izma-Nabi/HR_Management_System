const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const allowRoles = require("../../middlewares/role.middleware");
const employeeAuthController = require("./employee-auth.controller");
const {
  loginSchema
} = require("./employee-auth.validation");

const router = express.Router();

// POST /api/v1/employee/auth/login
// Public route. Returns a JWT if credentials are valid.
router.post(
  "/login",
  validate(loginSchema),
  employeeAuthController.login
);

// GET /api/v1/employee/auth/me
// Protected route. Requires a valid token and EMPLOYEE role.
router.get(
  "/me",
  authMiddleware,
  allowRoles("EMPLOYEE"),
  employeeAuthController.me
);

// POST /api/v1/employee/auth/logout
// Protected route. Client should delete the token after this succeeds.
router.post(
  "/logout",
  authMiddleware,
  allowRoles("EMPLOYEE"),
  employeeAuthController.logout
);

module.exports = router;
