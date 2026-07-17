const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const dashboardService = require("./dashboard.service");

const getDashboard = asyncHandler(async (req, res) => {

  const result = await dashboardService.getDashboard(req.user);

  return sendSuccess(
    res,
    200,
    "Dashboard fetched successfully",
    result
  );

});

module.exports = {
  getDashboard
};
