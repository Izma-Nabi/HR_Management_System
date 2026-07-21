const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const attendanceController = require("./attendance.controller");

const router = express.Router();

router.post(
  "/import",
  authMiddleware,
  requirePermission("MANAGE_EMPLOYEES"),
  attendanceController.importAttendance
);

module.exports = router;
