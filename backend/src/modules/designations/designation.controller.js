const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const service = require("./designation.service");

const listDesignations = asyncHandler(async (req, res) => {
  const designations = await service.listDesignations();

  return sendSuccess(
    res,
    200,
    "Designations fetched successfully",
    designations
  );
});

module.exports = {
  listDesignations
};
