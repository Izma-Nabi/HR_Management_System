const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const dashboardService = require("./dashboard.service");

const getSummary = asyncHandler(async (req, res) => {

  const result = await dashboardService.getSummary(req.user);

  return sendSuccess(
    res,
    200,
    "Dashboard summary fetched successfully",
    result
  );

});

const getAttendanceTrend = asyncHandler(async (req, res) => {

  const result = await dashboardService.getAttendanceTrend();

  return sendSuccess(
    res,
    200,
    "Attendance trend fetched successfully",
    result
  );

});

const getDepartmentAttendance = asyncHandler(async (req,res)=>{
  const result = await dashboardService.getDepartmentAttendance();


  return sendSuccess(
    res,
    200,
    "Department attendance fetched successfully",
    result
  );

});

const getTopLateEmployees = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopLateEmployees();

  res.status(200).json({
    success: true,
    data
  });
});


module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance,
  getTopLateEmployees
};