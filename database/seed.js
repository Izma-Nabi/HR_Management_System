require("../global/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const roles = [
  { roleName: "Super Admin" },
  { roleName: "Admin" },
  { roleName: "Employee" }
];

const designationsByDepartment = {
  "Human Resources": [
    "HR Intern",
    "HR Executive",
    "HR Manager"
  ],
  "Information Technology": [
    "IT Support Engineer",
    "System Administrator",
    "Network Engineer",
    "Cloud Engineer",
    "IT Manager"
  ],
  Finance: [
    "Finance Executive",
    "Accountant",
    "Financial Analyst",
    "Finance Manager"
  ],
  "Software Development": [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile App Developer",
    "UI/UX Designer",
    "Project Manager",
    "Software Architect",
    "Engineering Manager"
  ],
  "Quality Assurance": [
    "QA Engineer",
    "Automation QA Engineer",
    "QA Lead"
  ],
  "Sales & Marketing": [
    "Sales Executive",
    "Business Development Executive",
    "Marketing Executive",
    "Digital Marketing Specialist",
    "SEO Specialist",
    "Content Writer",
    "Marketing Manager"
  ],
  "Customer Support": [
    "Customer Support Representative",
    "Technical Support Engineer",
    "Support Team Lead"
  ],
  "Cyber Security": [
    "Cyber Security Analyst",
    "SOC Analyst",
    "Penetration Tester",
    "Information Security Engineer",
    "Cyber Security Manager"
  ]
};

const permissions = [
  "CREATE_ADMIN",
  "VIEW_ADMINS",
  "UPDATE_ADMIN",
  "DELETE_ADMIN",
  "CREATE_DEPARTMENT",
  "VIEW_DEPARTMENTS",
  "UPDATE_DEPARTMENT",
  "DELETE_DEPARTMENT",
  "CREATE_EMPLOYEE",
  "VIEW_EMPLOYEES",
  "UPDATE_EMPLOYEE",
  "DELETE_EMPLOYEE",
  "UPDATE_USER",
  "VIEW_ROLES",
  "CREATE_ROLE",
  "UPDATE_ROLE",
  "DELETE_ROLE",
  "VIEW_DESIGNATIONS",
  "CREATE_DESIGNATION",
  "DELETE_DESIGNATION",
  "IMPORT_ATTENDANCE",
  "VIEW_SYSTEM_SUMMARY",
  "VIEW_TEAM_ATTENDANCE",
  "VIEW_OWN_ATTENDANCE",
  "VIEW_REPORTS",
  "CREATE_LEAVE",
  "VIEW_OWN_LEAVES",
  "VIEW_TEAM_LEAVES",
  "VIEW_ALL_LEAVES",
  "APPROVE_LEAVE",
  "REJECT_LEAVE",
  "CANCEL_LEAVE"
];

const rolePermissionGroups = [
  {
    roleNames: ["Super Admin", "SUPER_ADMIN", "SUPER ADMIN"],
    permissions: [
      "CREATE_ADMIN",
      "VIEW_ADMINS",
      "UPDATE_ADMIN",
      "DELETE_ADMIN",
      "CREATE_DEPARTMENT",
      "VIEW_DEPARTMENTS",
      "UPDATE_DEPARTMENT",
      "DELETE_DEPARTMENT",
      "CREATE_EMPLOYEE",
      "VIEW_EMPLOYEES",
      "UPDATE_EMPLOYEE",
      "DELETE_EMPLOYEE",
      "UPDATE_USER",
      "VIEW_ROLES",
      "CREATE_ROLE",
      "UPDATE_ROLE",
      "DELETE_ROLE",
      "VIEW_DESIGNATIONS",
      "CREATE_DESIGNATION",
      "DELETE_DESIGNATION",
      "IMPORT_ATTENDANCE",
      "VIEW_SYSTEM_SUMMARY",
      "VIEW_TEAM_ATTENDANCE",
      "VIEW_OWN_ATTENDANCE",
      "VIEW_REPORTS",
      "VIEW_ALL_LEAVES",
      "VIEW_TEAM_LEAVES",
      "APPROVE_LEAVE",
      "REJECT_LEAVE"
    ]
  },
  {
    roleNames: ["Admin", "ADMIN"],
    permissions: [
      "CREATE_LEAVE",
      "CREATE_EMPLOYEE",
      "VIEW_EMPLOYEES",
      "UPDATE_EMPLOYEE",
      "DELETE_EMPLOYEE",
      "UPDATE_USER",
      "IMPORT_ATTENDANCE",
      "VIEW_SYSTEM_SUMMARY",
      "VIEW_REPORTS",
      "VIEW_OWN_LEAVES",
      "VIEW_ALL_LEAVES",
      "VIEW_TEAM_LEAVES",
      "APPROVE_LEAVE",
      "REJECT_LEAVE",
      "CANCEL_LEAVE"
    ]
  },
  {
    roleNames: ["Employee", "EMPLOYEE"],
    permissions: [
      "CREATE_LEAVE",
      "VIEW_OWN_ATTENDANCE",
      "VIEW_OWN_LEAVES",
      "CANCEL_LEAVE"
    ]
  }
];

const normalizeKey = (value) => {
  return String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const seedRoles = async () => {
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        roleName: role.roleName
      },
      update: role,
      create: role
    });
  }
};

const seedDesignations = async () => {
  const departments = await prisma.department.findMany({
    where: {
      departmentName: {
        in: Object.keys(designationsByDepartment)
      }
    }
  });

  const departmentMap = new Map(
    departments.map((department) => [department.departmentName, department.id])
  );

  for (const [departmentName, designations] of Object.entries(designationsByDepartment)) {
    const departmentId = departmentMap.get(departmentName);

    if (!departmentId) {
      continue;
    }

    for (const designationName of designations) {
      await prisma.designation.upsert({
        where: {
          departmentId_designationName: {
            departmentId,
            designationName
          }
        },
        update: {
          designationName
        },
        create: {
          designationName,
          departmentId
        }
      });
    }
  }
};

const seedPermissions = async () => {
  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: {
        permissionName
      },
      update: {
        permissionName
      },
      create: {
        permissionName
      }
    });
  }
};

const seedRolePermissions = async () => {
  const seededRoles = await prisma.role.findMany();
  const seededPermissions = await prisma.permission.findMany();
  const roleMap = new Map(seededRoles.map((role) => [normalizeKey(role.roleName), role.id]));
  const permissionMap = new Map(
    seededPermissions.map((permission) => [normalizeKey(permission.permissionName), permission.id])
  );

  for (const group of rolePermissionGroups) {
    const roleId = group.roleNames
      .map(normalizeKey)
      .map((roleName) => roleMap.get(roleName))
      .find(Boolean);

    if (!roleId) {
      throw new Error(`Missing role: ${group.roleNames[0]}`);
    }

    for (const permissionName of group.permissions) {
      const permissionId = permissionMap.get(normalizeKey(permissionName));

      if (!permissionId) {
        throw new Error(`Missing permission: ${permissionName}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId
          }
        },
        update: {},
        create: {
          roleId,
          permissionId
        }
      });
    }
  }
};

const formatAdminCode = (number) => {
  return `ADM${String(number).padStart(3, "0")}`;
};

const generateNextAdminCode = async () => {
  const rows = await prisma.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(userCode, 4) AS UNSIGNED)), 0) AS maxNumber
    FROM users
    WHERE userCode REGEXP '^ADM[0-9]+$'
  `;

  return formatAdminCode(Number(rows[0]?.maxNumber || 0) + 1);
};

const seedSuperAdmin = async () => {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Super Admin seed skipped. Set SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD to enable it.");
    return;
  }

  const superAdminRole = await prisma.role.findFirst({
    where: {
      roleName: {
        in: ["Super Admin", "SUPER ADMIN", "SUPER_ADMIN"]
      }
    }
  });

  if (!superAdminRole) {
    throw new Error("Super Admin role is missing.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      userCode: true
    }
  });

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS || 12));
  const userCode = existingUser?.userCode || await generateNextAdminCode();

  await prisma.user.upsert({
    where: {
      email
    },
    update: {
      userCode,
      firstName: "Super",
      lastName: "Admin",
      passwordHash,
      roleId: superAdminRole.id,
      employmentStatus: "ACTIVE"
    },
    create: {
      userCode,
      firstName: "Super",
      lastName: "Admin",
      email,
      passwordHash,
      roleId: superAdminRole.id,
      employmentStatus: "ACTIVE"
    }
  });
};

const main = async () => {
  await seedRoles();
  await seedDesignations();
  await seedPermissions();
  await seedRolePermissions();
  await seedSuperAdmin();

  console.log("Database seeded successfully.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
