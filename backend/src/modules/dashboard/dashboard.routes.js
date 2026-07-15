const express = require("express");

const dashboardController = require("./dashboard.controller");

const router = express.Router();


router.get(
  "/summary",
  dashboardController.getSummary
);


router.get(
  "/attendance-trend",
  dashboardController.getAttendanceTrend
);


router.get(
  "/department-attendance",
  dashboardController.getDepartmentAttendance
);


module.exports = router;