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

module.exports = {
  importAttendance
};