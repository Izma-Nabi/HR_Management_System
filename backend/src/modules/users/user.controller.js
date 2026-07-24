const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const userService = require("./user.service");

const createUser = asyncHandler(async (req, res) => {
  const result = await userService.createUser(req.body);
  return sendSuccess(
    res,
    201,
    "User created successfully",
    result
  );
});


const listUsers = asyncHandler(async (req,res)=>{
  const result = await userService.listUsers();
  return sendSuccess(
    res,
    200,
    "Users fetched successfully",
    result
  );
});


const getUser = asyncHandler(async(req,res)=>{
  const result = await userService.getUser(req.params.id);
  return sendSuccess(
    res,
    200,
    "User fetched successfully",
    result
  );
});


const updateUser = asyncHandler(async(req,res)=>{
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


const deleteUser = asyncHandler(async(req,res)=>{
  const result = await userService.deleteUser(
    req.params.id
  );
  return sendSuccess(
    res,
    200,
    "User deleted successfully",
    result
  );
});

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser
};