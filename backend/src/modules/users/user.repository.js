const { prisma } = require("../../../../database/prisma");
const { roleNameCandidates, toRoleKey } = require("../../utils/roles");
const { generateNextEmployeeCode } = require("../../utils/employee-code");
const { generateNextAdminCode } = require("../../utils/admin-code");

const userProfileSelect = {
  id: true,
  userCode: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  photo: true,
  designationId: true,
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
  }
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

  const managedDepartments = [];

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
    managedDepartments,

    managedDepartmentIds: [],

    designation: user.designationId ?? null,
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
    designation: user.designationId ?? null,
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

const findRoleByName = async (roleName) => {
  return prisma.role.findFirst({
    where: {
      roleName: {
        in: roleNameCandidates(roleName)
      }
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


const replaceDepartmentAssignment = async (
  dbClient,
  userId,
  departmentIds
) => {

  await dbClient.adminDepartment.deleteMany({
    where:{
      userId:Number(userId)
    }
  });


  if(
    !Array.isArray(departmentIds) ||
    departmentIds.length === 0
  ){
    return;
  }


  await dbClient.adminDepartment.createMany({
    data: departmentIds.map(id=>({
      userId:Number(userId),
      departmentId:Number(id)
    }))
  });
};



const findAdminById = async (id, dbClient = prisma) => {

  const user = await dbClient.user.findFirst({
    where:{
      id:Number(id),
      ...roleWhere("ADMIN")
    },
    select:userProfileSelect
  });

  return mapAdmin(user);
};

const listAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: roleWhere("ADMIN"),
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ],
    select: userProfileSelect
  });

  return admins.map(mapAdmin);
};

const listUsers = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: {
        roleName: {
          in: ["Admin", "ADMIN", "Employee", "EMPLOYEE", "Super Admin", "SUPER_ADMIN", "SUPER ADMIN"]
        }
      }
    },
    orderBy: [
      {
        firstName: "asc"
      },
      {
        lastName: "asc"
      }
    ],
    select: userProfileSelect
  });

  return users.map((user) => {
    const roleKey = toRoleKey(user.role);

    if (roleKey === "ADMIN" || roleKey === "SUPER_ADMIN") {
      return {
        id: user.id,
        userId: user.id,
        type: roleKey === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        name: fullNameFromUser(user),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        designation: user.designationId ?? null,
        role: roleKey,
        roleName: user.role?.roleName || null,
        status: user.employmentStatus,
        departmentId: user.departmentId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }

    return {
      id: user.id,
      userId: user.id,
      type: "EMPLOYEE",
      name: fullNameFromUser(user),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      designation: user.designationId ?? null,
      role: roleKey,
      roleName: user.role?.roleName || null,
      status: user.employmentStatus,
      departmentId: user.departmentId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  });
};

const createAdmin = async (data) => {

  return prisma.$transaction(async (tx)=>{

    const adminCode = await generateNextAdminCode(tx);


    const user = await tx.user.create({

      data:{
        userCode:adminCode,
        firstName:data.firstName,
        lastName:data.lastName,
        email:data.email,
        passwordHash:data.passwordHash,
        phone:data.phone,
        address:data.address,
        photo:data.photo,
        designationId: data.designation,

        joiningDate:data.joiningDate
          ? new Date(data.joiningDate)
          : null,

        employmentStatus:data.employmentStatus || "ACTIVE",

        departmentId:data.departmentId
          ? Number(data.departmentId)
          : null,

        roleId:data.roleId
      },

      select:{
        id:true
      }

    });


    await replaceDepartmentAssignment(
      tx,
      user.id,
      data.managedDepartmentIds
    );


    return findAdminById(user.id,tx);

  });

};

const updateAdmin = async (id, data) => {
  return prisma.$transaction(
    async (tx) => {

      const existingAdmin = await findAdminById(id, tx);

      if (!existingAdmin) {
        return null;
      }

      const userData = {};

      if (data.firstName !== undefined) {
        userData.firstName = data.firstName;
      }

      if (data.lastName !== undefined) {
        userData.lastName = data.lastName;
      }

      if (data.email !== undefined) {
        userData.email = data.email;
      }

      if (data.passwordHash !== undefined) {
        userData.passwordHash = data.passwordHash;
      }

      if (data.phone !== undefined) {
        userData.phone = data.phone;
      }

      if (data.address !== undefined) {
        userData.address = data.address;
      }

      if (data.photo !== undefined) {
        userData.photo = data.photo;
      }

      if (data.designation !== undefined) {
        userData.designationId = data.designation;
      }

      if (data.joiningDate !== undefined) {
        userData.joiningDate = data.joiningDate
          ? new Date(data.joiningDate)
          : null;
      }

      if (data.employmentStatus !== undefined) {
        userData.employmentStatus = data.employmentStatus;
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where:{
            id: existingAdmin.userId
          },
          data:userData
        });
      }


      if (data.managedDepartmentIds !== undefined) {
        await replaceDepartmentAssignment(
          tx,
          existingAdmin.userId,
          data.managedDepartmentIds
        );
      }


      return findAdminById(
        existingAdmin.userId,
        tx
      );

    },
    {
      timeout:15000
    }
  );
};

const deleteAdmin = async (id) => {
  return prisma.$transaction(async (tx) => {
    const existingAdmin = await findAdminById(id, tx);

    if (!existingAdmin) {
      return null;
    }

    await tx.user.delete({
      where: {
        id: existingAdmin.userId
      }
    });

    return existingAdmin;
  });
};

const createEmployee = async (data) => {
  return prisma.$transaction(async (tx) => {
    const employeeCode = await generateNextEmployeeCode(tx);

    const user = await tx.user.create({
      data: {
        userCode: employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        designationId: data.designation,
        departmentId: data.departmentId
        ? Number(data.departmentId)
        : null,
        employmentStatus: data.employmentStatus || "ACTIVE",
        roleId: data.roleId
      },
      select: {
        id: true
      }
    });

    await replaceDepartmentAssignment(tx, user.id, data.departmentId);

    return tx.user.findUnique({
      where: {
        id: user.id
      },
      select: userProfileSelect
    });
  });
};

module.exports = {
  findUserByEmail,
  findRoleByName,
  findDepartmentById,
  findAdminById,
  listAdmins,
  listUsers,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  createEmployee,
  mapEmployeeUser,
  toSafeUser
};
