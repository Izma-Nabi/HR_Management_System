const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const attendanceService = require("./attendance.service");

const importAttendance = asyncHandler(async (req, res) => {

  const result = await attendanceService.importAttendance();

  return sendSuccess(
    res,
    200,
    "Attendance imported successfully from Google Sheet",
    result
  );
});

const getMyCurrentWeek = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyCurrentWeek(
    req.user.id,
    req.query.startDate
  );

  return sendSuccess(
    res,
    200,
    "Attendance week fetched successfully",
    result
  );
});

const getMyDayDetails = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyDayDetails(
    req.user.id,
    req.params.date
  );

  return sendSuccess(
    res,
    200,
    "Attendance details fetched successfully",
    result
  );
});

const createComplaint = asyncHandler(async (req, res) => {
  const result = await attendanceService.createAttendanceComplaint(
    req.user.id,
    req.body
  );

  return sendSuccess(
    res,
    201,
    "Attendance complaint submitted successfully",
    result
  );
});

module.exports = {
  createComplaint,
  getMyCurrentWeek,
  getMyDayDetails,
  importAttendance
};
