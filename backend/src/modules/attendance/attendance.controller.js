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

const getAllUsersWeek = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAllUsersWeek(
    req.query.startDate
  );

  return sendSuccess(
    res,
    200,
    "All user attendance fetched successfully",
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
    "Attendance change request submitted successfully",
    result
  );
});

const getMyTodayAttendance = asyncHandler(async (req, res) => {
  const result =
    await attendanceService.getMyTodayAttendance(req.user.id);

  return sendSuccess(
    res,
    200,
    "Today's attendance fetched successfully",
    result
  );
});

const getAttendanceComplaints = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceComplaints(req.user);

  return sendSuccess(
    res,
    200,
    "Attendance change requests fetched successfully",
    result
  );
});


const reviewAttendanceComplaint = asyncHandler(async (req, res) => {
  const result = await attendanceService.reviewAttendanceComplaint(
    req.params.id,
    req.body,
    req.user
  );

  return sendSuccess(
    res,
    200,
    "Attendance change request reviewed successfully",
    result
  );
});


const editAttendanceComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result =
    await attendanceService.editAttendanceComplaint(
      Number(id),
      req.body,
      req.user
    );

  return sendSuccess(
    res,
    200,
    "Attendance updated successfully",
    result
  );
});


const insertManualAttendance = asyncHandler(async (req, res) => {
 console.log("=== insertManualAttendance called ===");
  console.log(req.body);

  const result =
    await attendanceService.insertManualAttendance(
    req.body,
    req.user
  );

  return sendSuccess(
    res,
    201,
    "Attendance record created successfully",
    result
  );

});

module.exports = {
  createComplaint,
  getMyCurrentWeek,
  getAllUsersWeek,
  getMyDayDetails,
  importAttendance,
  getMyTodayAttendance,
  getAttendanceComplaints,
  reviewAttendanceComplaint,
  editAttendanceComplaint,
  insertManualAttendance
};
