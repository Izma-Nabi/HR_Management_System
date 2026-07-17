const express = require("express");

const attendanceController = require("./attendance.controller");

const router = express.Router();

router.post(
  "/import",
  attendanceController.importAttendance
);

module.exports = router;