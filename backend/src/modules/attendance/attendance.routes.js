const express = require("express");

const router = express.Router();

const attendanceController = require("./attendance.controller");

const authMiddleware = require("../../middlewares/auth.middleware");
const {
  requirePermission
} = require("../../middlewares/permission.middleware");


// Employee routes
router.post(
  "/complaints",
  authMiddleware,
  attendanceController.createComplaint
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


module.exports = router;