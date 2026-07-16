const asyncHandler = require("../../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../../utils/apiResponse");

const attendanceService = require("./attendance.service");

const importAttendance = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Attendance Excel file is required");
  }

  const result = await attendanceService.importAttendance(req.file);

  return sendSuccess(
    res,
    201,
    "Attendance imported successfully",
    result
  );
});

module.exports = {
  importAttendance
};