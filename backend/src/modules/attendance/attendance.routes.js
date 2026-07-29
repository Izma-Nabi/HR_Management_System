const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requireAnyPermission,
  requirePermission
} = require("../../middlewares/permission.middleware");
const validate = require("../../middlewares/validate.middleware");
const attendanceController = require("./attendance.controller");
const attendanceValidation = require("./attendance.validation");

const router = express.Router();
const canViewOwnAttendance = requireAnyPermission(
  "VIEW_OWN_ATTENDANCE",
  "VIEW_TEAM_ATTENDANCE",
  "IMPORT_ATTENDANCE"
);

router.get(
  "/my/week",
  authMiddleware,
  canViewOwnAttendance,
  validate(attendanceValidation.weekQuery, "query"),
  attendanceController.getMyCurrentWeek
);

router.get(
  "/my/day/:date",
  authMiddleware,
  canViewOwnAttendance,
  validate(attendanceValidation.dayParams, "params"),
  attendanceController.getMyDayDetails
);

router.post(
  "/complaints",
  authMiddleware,
  canViewOwnAttendance,
  validate(attendanceValidation.createComplaint),
  attendanceController.createComplaint
);

router.post(
  "/import",
  authMiddleware,
  requirePermission("IMPORT_ATTENDANCE"),
  attendanceController.importAttendance
);

module.exports = router;
