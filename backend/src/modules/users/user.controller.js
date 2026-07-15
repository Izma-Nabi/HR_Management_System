const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const userService = require("./user.service");

const createAdmin = asyncHandler(async (req,res)=>{

  const result = await userService.createAdmin(req.body);

  return sendSuccess(
    res,
    201,
    "Administrator created successfully",
    result
  );

});

const listAdmins = asyncHandler(async (req, res) => {

  const result = await userService.listAdmins();

  return sendSuccess(
    res,
    200,
    "Administrators fetched successfully",
    result
  );

});

const getAdmin = asyncHandler(async (req, res) => {

  const result = await userService.getAdmin(req.params.id);

  return sendSuccess(
    res,
    200,
    "Administrator fetched successfully",
    result
  );

});

const updateAdmin = asyncHandler(async (req,res)=>{

  const result = await userService.updateAdmin(
    req.params.id,
    req.body
  );

  return sendSuccess(
    res,
    200,
    "Administrator updated successfully",
    result
  );

});

const deleteAdmin = asyncHandler(async (req, res) => {

  const result = await userService.deleteAdmin(req.params.id);

  return sendSuccess(
    res,
    200,
    "Administrator deleted successfully",
    result
  );

});

const createEmployee = asyncHandler(async (req, res) => {

  const result = await userService.createEmployee(req.body);

  return sendSuccess(
    res,
    201,
    "Employee created successfully",
    result
  );

});

module.exports = {
  createAdmin,
  listAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  createEmployee
};
