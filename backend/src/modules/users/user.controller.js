const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const userService = require("./user.service");

const createUser = asyncHandler(async (req, res) => {
  const result = await userService.createUser(req.body, req.user);

  return sendSuccess(
    res,
    201,
    "User created successfully",
    result
  );
});

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

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers();

  return sendSuccess(
    res,
    200,
    "Users fetched successfully",
    result
  );
});

const getUser = asyncHandler(async (req, res) => {
  const result = await userService.getUser(req.params.id);

  return sendSuccess(
    res,
    200,
    "User fetched successfully",
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

const updateUser = asyncHandler(async (req, res) => {
  const result = await userService.updateUser(
    req.params.id,
    req.body
  );

  return sendSuccess(
    res,
    200,
    "User updated successfully",
    result
  );
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user);

  return sendSuccess(
    res,
    200,
    "User deleted successfully",
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
  createUser,
  createAdmin,
  listAdmins,
  listUsers,
  getUser,
  getAdmin,
  updateAdmin,
  updateUser,
  deleteUser,
  deleteAdmin,
  createEmployee
};
