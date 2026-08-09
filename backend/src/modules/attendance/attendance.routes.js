const express = require("express");

const router = express.Router();

const attendanceController = require("./attendance.controller");

const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requirePermission,
  requireSuperAdmin
} = require("../../middlewares/permission.middleware");


// Employee routes
router.post(
  "/complaints",
  authMiddleware,
  attendanceController.createComplaint
);

router.get(
  "/my/week",
  authMiddleware,
  attendanceController.getMyCurrentWeek
);

router.get(
  "/my/day/:date",
  authMiddleware,
  attendanceController.getMyDayDetails
);

router.get(
  "/all/week",
  authMiddleware,
  requireSuperAdmin,
  attendanceController.getAllUsersWeek
);


// Admin - View complaints
router.get(
  "/admin/complaints",
  authMiddleware,
  requirePermission("VIEW_ATTENDANCE_COMPLAINTS"),
  attendanceController.getAttendanceComplaints
);


// Admin - Review complaint
router.patch(
  "/admin/complaints/:id",
  authMiddleware,
  requirePermission("MANAGE_ATTENDANCE"),
  attendanceController.reviewAttendanceComplaint
);

router.patch(
  "/admin/complaints/:id/edit",
  authMiddleware,
  attendanceController.editAttendanceComplaint
);

router.post(
  "/manual",
  authMiddleware,
  requirePermission("MANAGE_ATTENDANCE"),
  attendanceController.insertManualAttendance

);

router.post(
  "/admin/manual",
  authMiddleware,
  requirePermission("MANAGE_ATTENDANCE"),
  attendanceController.insertManualAttendance
);


module.exports = router;
