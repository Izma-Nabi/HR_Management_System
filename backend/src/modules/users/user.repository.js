const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");

const userProfileSelect = {
  id: true,
  userCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  photo: true,
  designationId:true,

  designation:{
    select:{
      id:true,
      designationName:true
    }
  },
  joiningDate: true,
  employmentStatus: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      roleName: true
    }
  },
 departmentId: true,

department: {
  select: {
    id: true,
    departmentName: true,
    description: true
  }
},

};

const fullNameFromUser = (user) => {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
};

const toSafeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: fullNameFromUser(user),
    email: user.email,
    role: toRoleKey(user.role),
    status: user.employmentStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const mapAdmin = (user) => {
  if (!user) {
    return null;
  }


  return {
    id: user.id,
    userId: user.id,
    adminCode: user.userCode,

    firstName: user.firstName,
    lastName: user.lastName,

    phone: user.phone,
    address: user.address,
    photo: user.photo,

    // users table department
    departmentId: user.departmentId || null,

    // users table department object
    department: user.department || null,

    // admin_departments table departments

    designation: user.designation,
    employmentStatus:user.employmentStatus,
    joiningDate:user.joiningDate,

    createdAt:user.createdAt,
    updatedAt:user.updatedAt,

    user:toSafeUser(user)
  };
};

const mapEmployeeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    userId: user.id,
    employeeCode: user.userCode,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address,
    photo: user.photo,
    departmentId: user.departmentId,
    department: user.department,
    designation: user.designation,
    joiningDate: user.joiningDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};


const roleWhere = (roleName) => ({
  role: {
    roleName: {
      in: roleNameCandidates(roleName)
    }
  }
});

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};



const findDepartmentById = async (id, dbClient = prisma) => {
  if (!id) {
    return null;
  }

  return dbClient.department.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true
    }
  });
};

// const createUser = async(data)=>{

// return prisma.user.create({
// data:{
// userCode: await generateNextEmployeeCode(),
// firstName:data.firstName,
// lastName:data.lastName,
// email:data.email,
// passwordHash:data.passwordHash,
// phone:data.phone,
// address:data.address,
// photo:data.photo,
// roleId:Number(data.roleId),

// departmentId:
// data.departmentId
// ? Number(data.departmentId)
// :null,

// designationId:
// data.designationId
// ? Number(data.designationId)
// :null,

// employmentStatus:
// data.employmentStatus || "ACTIVE"
// },

// select:userProfileSelect
// });
// };

const createUser = async(data)=>{

  console.log("CREATE USER DATA:", data);

  const user = await prisma.user.create({
    data:{
      userCode: await generateNextUserCode(),

      firstName:data.firstName,
      lastName:data.lastName,

      email:data.email,
      passwordHash:data.passwordHash,

      phone:data.phone,
      address:data.address,
      photo:data.photo,

      roleId:Number(data.roleId),

      departmentId:
        data.departmentId
        ? Number(data.departmentId)
        : null,

      designationId:
        data.designationId
        ? Number(data.designationId)
        : null,

      employmentStatus:data.employmentStatus || "ACTIVE"
    }
  });


  console.log("CREATED USER:", user);

  return user;
};


const findDesignationById = async(id)=>{
  if(!id){
    return null;
  }
  return prisma.designation.findUnique({
    where:{
      id:Number(id)
    }
  });
};

const findRoleByNameById = async(id)=>{
  return prisma.role.findUnique({
    where:{
      id:Number(id)
    }
  });
};
module.exports={
findUserByEmail,
findRoleByNameById,
findDepartmentById,
createUser,
mapEmployeeUser,
toSafeUser,
findDesignationById
};