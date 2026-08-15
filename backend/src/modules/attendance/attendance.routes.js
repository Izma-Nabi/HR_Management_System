const express = require("express");

const router = express.Router();

const attendanceController = require("./attendance.controller");
const attendanceValidation = require("./attendance.validation");
const attendanceDeviceController = require("./attendance.device.controller");
const attendanceDeviceValidation = require("./attendance.device.validation");

const authMiddleware = require("../../middlewares/auth.middleware");
const deviceAuthMiddleware = require("../../middlewares/device.auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  requirePermission,
  requireAnyRole,
  requireSuperAdmin
} = require("../../middlewares/permission.middleware");

router.post(
  "/device/event",
  deviceAuthMiddleware,
  validate(attendanceDeviceValidation.deviceEvent),
  attendanceDeviceController.receiveDeviceEvent
);


// Employee routes
router.post(
  "/complaints",
  authMiddleware,
  validate(attendanceValidation.createComplaint),
  attendanceController.createComplaint
);

router.get(
  "/my/week",
  authMiddleware,
  validate(attendanceValidation.weekQuery, "query"),
  attendanceController.getMyCurrentWeek
);

router.get(
  "/my/day/:date",
  authMiddleware,
  validate(attendanceValidation.dayParams, "params"),
  attendanceController.getMyDayDetails
);

router.get(
  "/all/week",
  authMiddleware,
  requireSuperAdmin,
  validate(attendanceValidation.weekQuery, "query"),
  attendanceController.getAllUsersWeek
);


// Admin - View complaints
router.get(
  "/admin/complaints",
  authMiddleware,
  requireAnyRole("SUPER_ADMIN", "ADMIN"),
  requirePermission("VIEW_ATTENDANCE_COMPLAINTS"),
  attendanceController.getAttendanceComplaints
);


// Admin - Review complaint
router.patch(
  "/admin/complaints/:id",
  authMiddleware,
  requireAnyRole("SUPER_ADMIN", "ADMIN"),
  requirePermission("MANAGE_ATTENDANCE"),
  validate(attendanceValidation.complaintParams, "params"),
  validate(attendanceValidation.reviewComplaint),
  attendanceController.reviewAttendanceComplaint
);

router.post(
  "/manual",
  authMiddleware,
  requireAnyRole("SUPER_ADMIN", "ADMIN"),
  requirePermission("MANAGE_ATTENDANCE"),
  attendanceController.insertManualAttendance

);

router.post(
  "/admin/manual",
  authMiddleware,
  requireAnyRole("SUPER_ADMIN", "ADMIN"),
  requirePermission("MANAGE_ATTENDANCE"),
  attendanceController.insertManualAttendance
);


module.exports = router;
