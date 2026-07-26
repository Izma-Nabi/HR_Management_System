require("../../global/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

const main = async () => {
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

  console.log("Department designations seeded successfully.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
