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
  designation: {
    select: {
      id: true,
      designationName: true
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

const mapUser = (user) => {
  if (!user) {
    return null;
  }

  const role = toRoleKey(user.role);

  return {
    id: user.id,
    userId: user.id,
    userCode: user.userCode,
    type: role,
    name: fullNameFromUser(user),
    fullName: fullNameFromUser(user),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    photo: user.photo,
    designationId: user.designationId ?? null,
    designation: user.designation?.designationName || null,
    designationDetails: user.designation || null,
    joiningDate: user.joiningDate,
    role,
    roleName: user.role?.roleName || null,
    status: user.employmentStatus,
    employmentStatus: user.employmentStatus,
    departmentId: user.departmentId,
    department: user.department || null,
    managedDepartments: user.department ? [user.department] : [],
    managedDepartmentIds: user.departmentId ? [user.departmentId] : [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const mapAdmin = (user) => {
  if (!user) {
    return null;
  }

  const mappedUser = mapUser(user);

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

    // Compatibility fields derived from the user's single department.
    managedDepartments: mappedUser.managedDepartments,

    managedDepartmentIds: mappedUser.managedDepartmentIds,

    designationId: user.designationId ?? null,
    designation: user.designation?.designationName || null,
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
    designationId: user.designationId ?? null,
    designation: user.designation?.designationName || null,
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

const findRoleById = async (id) => {
  if (!id) {
    return null;
  }

  return prisma.role.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true,
      roleName: true
    }
  });
};

const findDesignationById = async (id) => {
  if (!id) {
    return null;
  }

  return prisma.designation.findUnique({
    where: {
      id: Number(id)
    },
    select: {
      id: true,
      designationName: true,
      departmentId: true
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

const findUserById = async (id, dbClient = prisma) => {
  const user = await dbClient.user.findUnique({
    where: {
      id: Number(id)
    },
    select: userProfileSelect
  });

  return mapUser(user);
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

  return users.map(mapUser);
};

const createUser = async (data) => {
  return prisma.$transaction(async (tx) => {
    const userCode = data.roleKey === "EMPLOYEE"
      ? await generateNextEmployeeCode(tx)
      : await generateNextAdminCode(tx);

    const user = await tx.user.create({
      data: {
        userCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone,
        address: data.address,
        photo: data.photo,
        roleId: Number(data.roleId),
        departmentId: data.departmentId
          ? Number(data.departmentId)
          : null,
        designationId: data.designationId
          ? Number(data.designationId)
          : null,
        employmentStatus: data.employmentStatus || "ACTIVE"
      },
      select: {
        id: true
      }
    });

    return findUserById(user.id, tx);
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
        designationId: data.designationId ?? data.designation,

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

      if (data.designationId !== undefined) {
        userData.designationId = data.designationId;
      }

      if (data.joiningDate !== undefined) {
        userData.joiningDate = data.joiningDate
          ? new Date(data.joiningDate)
          : null;
      }

      if (data.employmentStatus !== undefined) {
        userData.employmentStatus = data.employmentStatus;
      }

      if (data.departmentId !== undefined) {
        userData.departmentId = data.departmentId
          ? Number(data.departmentId)
          : null;
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where:{
            id: existingAdmin.userId
          },
          data:userData
        });
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

const updateUser = async (id, data) => {
  return prisma.$transaction(
    async (tx) => {
      const existingUser = await findUserById(id, tx);

      if (!existingUser) {
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

      if (data.designationId !== undefined) {
        userData.designationId = data.designationId;
      }

      if (data.joiningDate !== undefined) {
        userData.joiningDate = data.joiningDate
          ? new Date(data.joiningDate)
          : null;
      }

      if (data.employmentStatus !== undefined) {
        userData.employmentStatus = data.employmentStatus;
      }

      if (data.departmentId !== undefined) {
        userData.departmentId = data.departmentId
          ? Number(data.departmentId)
          : null;
      }

      if (data.roleId !== undefined) {
        userData.roleId = Number(data.roleId);
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: {
            id: existingUser.id
          },
          data: userData
        });
      }

      return findUserById(existingUser.id, tx);
    },
    {
      timeout: 15000
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

const deleteUser = async (id) => {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    return null;
  }

  await prisma.user.delete({
    where: {
      id: Number(id)
    }
  });

  return existingUser;
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
        designationId: data.designationId ?? data.designation,
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
  findRoleById,
  findDesignationById,
  findDepartmentById,
  findAdminById,
  findUserById,
  listAdmins,
  listUsers,
  createUser,
  createAdmin,
  updateAdmin,
  updateUser,
  deleteAdmin,
  deleteUser,
  createEmployee,
  mapUser,
  mapEmployeeUser,
  toSafeUser
};
