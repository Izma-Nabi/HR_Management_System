const { ApiError } = require("../../utils/apiResponse");
const { hashPassword } = require("../../utils/password");
const repository = require("./user.repository");

const buildFullName = ({ firstName, lastName }) => {
  return `${firstName || ""} ${lastName || ""}`.trim();
};

const normalizeEmploymentStatus = (value) => {
  if (!value) {
    return "ACTIVE";
  }
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

const ensureDepartmentExists = async(departmentId)=>{
  if(!departmentId){
    return null;
  }
  const department =
    await repository.findDepartmentById(departmentId);
  if(!department){
    throw new ApiError(
      400,
      "Department not found"
    );
  }

  return department;
};

const createUser = async(payload)=>{
  const existingUser =
    await repository.findUserByEmail(payload.email);
  if(existingUser){
    throw new ApiError(
      409,
      "Email already exists"
    );
  }
  const role =
    await repository.findRoleByNameById(
      payload.roleId
    );

  if(!role){
    throw new ApiError(
      400,
      "Invalid role"
    );
  }

  const roleName =
    role.roleName
      .toUpperCase();
  // SUPER ADMIN

  if (roleName !== "SUPER ADMIN") {
  await ensureDepartmentExists(payload.departmentId);

  if (!payload.designationId) {
    throw new ApiError(
      400,
      "Designation is required"
    );
  }

  if(!payload.designationId){
    throw new ApiError(
      400,
      "Designation is required"
    );
  }

  const designation = await repository.findDesignationById(
    payload.designationId
  );

  if (!designation) {
    throw new ApiError(
      400,
      "Designation not found"
    );
  }

  if (
    designation.departmentId !== Number(payload.departmentId)
  ) {
    throw new ApiError(
      400,
      "Designation does not belong to the selected department"
    );
  }
}
};

const listUsers = async()=>{
  return repository.listUsers();
};

const getUser = async(id)=>{
  const user =  await repository.findUserById(id);
  if(!user){
    throw new ApiError(
      404,
      "User not found"
    );
  }
  return user;

};

const updateUser = async(id,payload)=>{

  const user = await repository.findUserById(id);
  if(!user){

    throw new ApiError(
      404,
      "User not found"
    );

  }
  const data={...payload};
  delete data.password;
  if(payload.password){
    data.passwordHash =
      await hashPassword(
        payload.password
      );
  }

  if(data.employmentStatus){

    data.employmentStatus =
      normalizeEmploymentStatus(
        data.employmentStatus
      );
  }

  return repository.updateUser(
    id,
    data
  );
};

const deleteUser = async(id)=>{
  const user = await repository.findUserById(id);

  if(!user){
    throw new ApiError(
      404,
      "User not found"
    );
  }
  return repository.deleteUser(id);
};


module.exports={
createUser,
listUsers,
getUser,
updateUser,
deleteUser,
};