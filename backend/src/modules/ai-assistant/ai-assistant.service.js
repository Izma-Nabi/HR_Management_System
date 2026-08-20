const { prisma } = require("../../../../database/prisma");
const env = require("../../../../global/env");
const employeeAiRules = require("./employee_ai_assistant_rules");

// ============================================================
// AI PROVIDERS
// ============================================================

const {
  askGemini,
} = require("./providers/gemini.provider");

const {
  askOpenRouter,
} = require("./providers/openrouter.provider");

// ============================================================
// EMPLOYEE AI RULES
// ============================================================

const {
  EMPLOYEE_AI_RULES,
} = require("./employee_ai_assistant_rules");

// ============================================================
// HELPERS
// ============================================================

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const formatName = (user) => {
  if (!user) {
    return "Unknown";
  }

  const name = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.fullName || user.email || "Unknown";
};

const formatTime = (date) => {
  if (!date) {
    return "Missing";
  }

  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (date) => {
  if (!date) {
    return null;
  }

  return new Date(date).toISOString().split("T")[0];
};

const normalizeRole = (value) => {
  return safeString(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
};

// ============================================================
// EMPLOYEE CONTEXT
// ============================================================

const getEmployeeContext = async (userId) => {
  console.log("Getting employee context for user:", userId);

  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },

    select: {
      id: true,
      userCode: true,
      firstName: true,
      lastName: true,
      email: true,
      departmentId: true,
      designationId: true,

      role: {
        select: {
          id: true,
          roleName: true,
        },
      },

      department: {
        select: {
          id: true,
          departmentName: true,
          description: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Employee not found.");
  }

  return user;
};

// ============================================================
// ATTENDANCE
// ============================================================

const getAttendanceContext = async (userId) => {
  console.log("Getting attendance for user:", userId);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: Number(userId),
    },

    orderBy: {
      eventTime: "desc",
    },

    take: 1000,

    select: {
      id: true,
      userId: true,
      userCode: true,
      fullName: true,
      eventType: true,
      eventTime: true,
      remarks: true,
    },
  });

  console.log(
    "Attendance records found:",
    attendanceRecords.length
  );

  return attendanceRecords;
};

// ============================================================
// BUILD DAILY ATTENDANCE
// ============================================================

const buildDailyAttendance = (events) => {
  const daily = {};

  for (const event of events || []) {
    if (!event?.eventTime) {
      continue;
    }

    const date = formatDate(event.eventTime);

    if (!date) {
      continue;
    }

    if (!daily[date]) {
      daily[date] = {
        date,
        checkIn: null,
        checkOut: null,
        late: false,
        lateTime: null,
        events: [],
      };
    }

    const eventType = safeString(event.eventType)
      .trim()
      .toUpperCase();

    // --------------------------------------------------------
    // CHECK IN
    // --------------------------------------------------------

    if (
      eventType === "CHECK_IN" ||
      eventType === "CHECKIN" ||
      eventType === "IN"
    ) {
      if (
        !daily[date].checkIn ||
        new Date(event.eventTime) <
          new Date(daily[date].checkIn)
      ) {
        daily[date].checkIn = event.eventTime;
      }
    }

    // --------------------------------------------------------
    // CHECK OUT
    // --------------------------------------------------------

    if (
      eventType === "CHECK_OUT" ||
      eventType === "CHECKOUT" ||
      eventType === "OUT"
    ) {
      if (
        !daily[date].checkOut ||
        new Date(event.eventTime) >
          new Date(daily[date].checkOut)
      ) {
        daily[date].checkOut = event.eventTime;
      }
    }

    // --------------------------------------------------------
    // EXPLICIT LATE EVENT
    // --------------------------------------------------------

    if (
      eventType === "LATE" ||
      eventType === "LATE_ARRIVAL"
    ) {
      daily[date].late = true;
      daily[date].lateTime = event.eventTime;
    }

    daily[date].events.push({
      type: eventType,
      time: event.eventTime,
      remarks: event.remarks || null,
    });
  }

  // ==========================================================
  // CALCULATE LATE BASED ON OFFICE TIME
  // ==========================================================

  const OFFICE_START_HOUR = 10;
  const OFFICE_START_MINUTE = 0;

  for (const day of Object.values(daily)) {
    if (!day.checkIn) {
      continue;
    }

    const checkIn = new Date(day.checkIn);

    const officeStart = new Date(checkIn);

    officeStart.setHours(
      OFFICE_START_HOUR,
      OFFICE_START_MINUTE,
      0,
      0
    );

    if (checkIn > officeStart) {
      day.late = true;
      day.lateTime = day.checkIn;
    }
  }

  return Object.values(daily).sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );
};

// ============================================================
// ATTENDANCE FORMATTER
// ============================================================

const formatAttendanceContext = (dailyAttendance) => {
  if (!Array.isArray(dailyAttendance)) {
    return "No attendance records found.";
  }

  const officeStart =
    employeeAiRules.office.checkInTime;

  const officeEnd =
    employeeAiRules.office.checkOutTime;

  return dailyAttendance
    .map((day) => {
      let lateMinutes = 0;
      let lateStatus = "On time";

      if (day.checkIn) {
        lateMinutes =
          employeeAiRules.calculateLateMinutes(
            day.checkIn
          );

        if (lateMinutes > 0) {
          lateStatus = `Late by ${employeeAiRules.formatDuration(
            lateMinutes
          )}`;
        }
      }

      const events = Array.isArray(day.events)
        ? day.events
            .map((event) => {
              return `${event.type} at ${formatTime(
                event.time
              )}`;
            })
            .join(", ")
        : "No events";

      return [
        `Date: ${day.date}`,

        `Office hours: ${officeStart} - ${officeEnd}`,

        `Check-in: ${formatTime(day.checkIn)}`,

        `Check-out: ${formatTime(day.checkOut)}`,

        `Attendance status: ${lateStatus}`,

        `Late minutes: ${lateMinutes}`,

        `Events: ${events}`,
      ].join(" | ");
    })
    .join("\n");
};

// ============================================================
// LEAVES
// ============================================================

const getLeaveContext = async (userId) => {
  console.log("Getting leave records for user:", userId);

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      userId: Number(userId),
    },

    orderBy: {
      startDate: "desc",
    },

    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      totalDays: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(
    "Leave records found:",
    leaves.length
  );

  return leaves;
};

// ============================================================
// LEAVE CALCULATIONS
// ============================================================

const calculateLeaveSummary = (leaves) => {
  const summary = {
    totalRequestedDays: 0,
    approvedDays: 0,
    pendingDays: 0,
    rejectedDays: 0,
    cancelledDays: 0,

    byType: {},
  };

  for (const leave of leaves || []) {
    const days = Number(leave.totalDays) || 0;

    const status = safeString(leave.status)
      .trim()
      .toUpperCase();

    const type = safeString(leave.type)
      .trim()
      .toUpperCase();

    summary.totalRequestedDays += days;

    if (!summary.byType[type]) {
      summary.byType[type] = {
        requested: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        cancelled: 0,
      };
    }

    summary.byType[type].requested += days;

    if (
      status === "APPROVED" ||
      status === "ACCEPTED"
    ) {
      summary.approvedDays += days;
      summary.byType[type].approved += days;
    } else if (status === "PENDING") {
      summary.pendingDays += days;
      summary.byType[type].pending += days;
    } else if (status === "REJECTED") {
      summary.rejectedDays += days;
      summary.byType[type].rejected += days;
    } else if (
      status === "CANCELLED" ||
      status === "CANCELED"
    ) {
      summary.cancelledDays += days;
      summary.byType[type].cancelled += days;
    }
  }

  return summary;
};

const calculateLeaveBalances = (leaveRecords = []) => {
  const policies = employeeAiRules.leavePolicies;
  const calculationRules = employeeAiRules.leaveCalculation;

  if (!policies) {
    throw new Error(
      "employeeAiRules.leavePolicies is not configured."
    );
  }

  const usedStatuses = calculationRules?.usedStatuses || [
    "APPROVED",
  ];

  const requestedStatuses =
    calculationRules?.requestedStatuses || [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];

  const pendingStatuses =
    calculationRules?.pendingStatuses || [
      "PENDING",
    ];

  const used = {
    annualPaid: 0,
    sick: 0,
    casual: 0,
    unpaid: 0,
    maternity: 0,
    paternity: 0,
  };

  const requested = {
    annualPaid: 0,
    sick: 0,
    casual: 0,
    unpaid: 0,
    maternity: 0,
    paternity: 0,
  };

  const pending = {
    annualPaid: 0,
    sick: 0,
    casual: 0,
    unpaid: 0,
    maternity: 0,
    paternity: 0,
  };

  let requestedDays = 0;
  let usedDays = 0;
  let pendingDays = 0;
  let requestedCount = 0;
  let usedCount = 0;
  let pendingCount = 0;

  const normalizeLeaveType = (type) => {
    const value = String(type || "")
      .toLowerCase()
      .trim();

    if (
      value.includes("annual") ||
      value.includes("paid")
    ) {
      return "annualPaid";
    }

    if (value.includes("sick")) {
      return "sick";
    }

    if (value.includes("casual")) {
      return "casual";
    }

    if (value.includes("maternity")) {
      return "maternity";
    }

    if (value.includes("paternity")) {
      return "paternity";
    }

    if (value.includes("unpaid")) {
      return "unpaid";
    }

    return null;
  };

  for (const leave of leaveRecords) {
    const status = String(leave.status || "")
      .toUpperCase()
      .trim();

    const type = normalizeLeaveType(leave.type);

    const days = Number(leave.totalDays || 0);

    if (!days || days <= 0) {
      continue;
    }

    // ============================================================
    // REQUESTED
    // ============================================================

    if (requestedStatuses.includes(status)) {
      requestedDays += days;
      requestedCount += 1;

      if (type && requested[type] !== undefined) {
        requested[type] += days;
      }
    }

    // ============================================================
    // APPROVED / USED
    // ============================================================

    if (usedStatuses.includes(status)) {
      usedDays += days;
      usedCount += 1;

      if (type && used[type] !== undefined) {
        used[type] += days;
      }
    }

    // ============================================================
    // PENDING
    // ============================================================

    if (pendingStatuses.includes(status)) {
      pendingDays += days;
      pendingCount += 1;

      if (type && pending[type] !== undefined) {
        pending[type] += days;
      }
    }
  }

  // ============================================================
  // COMPANY ENTITLEMENTS
  // ============================================================

  const totalAnnualPaid = Number(
    policies.annualPaid || 0
  );

  const totalSick = Number(
    policies.sick || 0
  );

  const totalCasual = Number(
    policies.casual || 0
  );

  const totalMaternity =
    policies.maternity === null
      ? null
      : Number(policies.maternity || 0);

  const totalPaternity =
    policies.paternity === null
      ? null
      : Number(policies.paternity || 0);

  const totalUnpaid =
    policies.unpaid === null
      ? null
      : Number(policies.unpaid || 0);

  // ============================================================
  // REMAINING
  // ============================================================

  const remaining = {
    annualPaid: Math.max(
      0,
      totalAnnualPaid - used.annualPaid
    ),

    sick: Math.max(
      0,
      totalSick - used.sick
    ),

    casual: Math.max(
      0,
      totalCasual - used.casual
    ),

    maternity:
      totalMaternity === null
        ? null
        : Math.max(
            0,
            totalMaternity - used.maternity
          ),

    paternity:
      totalPaternity === null
        ? null
        : Math.max(
            0,
            totalPaternity - used.paternity
          ),

    unpaid:
      totalUnpaid === null
        ? null
        : Math.max(
            0,
            totalUnpaid - used.unpaid
          ),
  };

  return {
    policies: {
      annualPaid: totalAnnualPaid,
      sick: totalSick,
      casual: totalCasual,
      unpaid: totalUnpaid,
      maternity: totalMaternity,
      paternity: totalPaternity,
    },

    used,

    requested,

    pending,

    remaining,

    totals: {
      requestedDays,
      usedDays,
      pendingDays,
      requestedCount,
      usedCount,
      pendingCount,
    },
  };
};

const formatLeaveContext = (leaveRecords = []) => {
  const balances = calculateLeaveBalances(
    leaveRecords
  );

  const formatBalance = (
    label,
    policy,
    used,
    remaining,
    pending
  ) => {
    return [
      `${label}:`,
      `Entitlement: ${
        policy === null
          ? "Not specified"
          : policy
      }`,
      `Used: ${used}`,
      `Pending: ${pending}`,
      `Remaining: ${
        remaining === null
          ? "Not specified"
          : remaining
      }`,
    ].join(" | ");
  };

  const balanceText = [
    formatBalance(
      "Paid/Annual Leave",
      balances.policies.annualPaid,
      balances.used.annualPaid,
      balances.remaining.annualPaid,
      balances.pending.annualPaid
    ),

    formatBalance(
      "Sick Leave",
      balances.policies.sick,
      balances.used.sick,
      balances.remaining.sick,
      balances.pending.sick
    ),

    formatBalance(
      "Casual Leave",
      balances.policies.casual,
      balances.used.casual,
      balances.remaining.casual,
      balances.pending.casual
    ),

    formatBalance(
      "Maternity Leave",
      balances.policies.maternity,
      balances.used.maternity,
      balances.remaining.maternity,
      balances.pending.maternity
    ),

    formatBalance(
      "Paternity Leave",
      balances.policies.paternity,
      balances.used.paternity,
      balances.remaining.paternity,
      balances.pending.paternity
    ),

    formatBalance(
      "Unpaid Leave",
      balances.policies.unpaid,
      balances.used.unpaid,
      balances.remaining.unpaid,
      balances.pending.unpaid
    ),
  ].join("\n");

  const requestHistory = leaveRecords
    .map((leave) => {
      const startDate = leave.startDate
        ? new Date(leave.startDate)
            .toISOString()
            .split("T")[0]
        : "Unknown";

      const endDate = leave.endDate
        ? new Date(leave.endDate)
            .toISOString()
            .split("T")[0]
        : "Unknown";

      return [
        `Type: ${leave.type || "Unknown"}`,
        `Start: ${startDate}`,
        `End: ${endDate}`,
        `Days: ${leave.totalDays || 0}`,
        `Status: ${leave.status || "Unknown"}`,
        `Reason: ${leave.reason || "Not provided"}`,
      ].join(" | ");
    })
    .join("\n");

  return `
============================================================
LEAVE BALANCES
============================================================

${balanceText}

============================================================
LEAVE TOTALS
============================================================

Requested leave requests:
${balances.totals.requestedCount}

Requested leave days:
${balances.totals.requestedDays}

Approved/used leave requests:
${balances.totals.usedCount}

Approved/used leave days:
${balances.totals.usedDays}

Pending leave requests:
${balances.totals.pendingCount}

Pending leave days:
${balances.totals.pendingDays}

============================================================
LEAVE REQUEST HISTORY
============================================================

${requestHistory || "No leave requests found."}
`;
};

// ============================================================
// TEAM LEADS
// ============================================================

const getDepartmentTeamLeads = async (departmentId) => {
  if (!departmentId) {
    return [];
  }

  const teamLeadRoles =
    employeeAiRules.department?.teamLeadRoleNames || [];

  const managerRoles =
    employeeAiRules.department?.managerRoleNames || [];

  const roleNames = [
    ...teamLeadRoles,
    ...managerRoles,
  ];

  console.log(
    "Searching department management for department:",
    departmentId
  );

  console.log(
    "Allowed department roles:",
    roleNames
  );

  const people = await prisma.user.findMany({
    where: {
      departmentId: Number(departmentId),

      role: {
        roleName: {
          in: roleNames,
        },
      },
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,

      role: {
        select: {
          roleName: true,
        },
      },
    },
  });

  return people.map((person) => ({
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    roleName: person.role?.roleName || "Unknown",
  }));
};

const formatDepartmentManagementContext = (people) => {
  if (!Array.isArray(people) || people.length === 0) {
    return "No Team Leads or Managers were found in the employee's department.";
  }

  return people
    .map((person) => {
      const name = [
        person.firstName,
        person.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      return [
        `Name: ${name || "Unknown"}`,
        `Role: ${person.roleName || "Unknown"}`,
        `Email: ${person.email || "Not available"}`,
      ].join(" | ");
    })
    .join("\n");
};

// ============================================================
// HR USERS
// ============================================================

const getHRUsers = async () => {
  const hrUsers = await prisma.user.findMany({
    where: {
      role: {
        roleName: {
          in: [
            "HR",
            "ADMIN",
            "Admin",
            "Human Resources",
          ],
        },
      },
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return hrUsers;
};

// ============================================================
// TEAM LEAD CONTEXT
// ============================================================

const formatTeamLeadContext = (teamLeads) => {
  if (!teamLeads?.length) {
    return "No Team Leads found in the employee's department.";
  }

  return teamLeads
    .map(
      (lead) =>
        `${formatName(lead)} | Email: ${
          lead.email || "Not available"
        }`
    )
    .join("\n");
};

// ============================================================
// HR CONTEXT
// ============================================================

const formatHRContext = (hrUsers) => {
  if (!hrUsers?.length) {
    return "No HR users found.";
  }

  return hrUsers
    .map(
      (hr) =>
        `${formatName(hr)} | Email: ${
          hr.email || "Not available"
        }`
    )
    .join("\n");
};

// ============================================================
// AI PROVIDER
// ============================================================


const askAI = async ({
  systemPrompt,
  question,
}) => {
  const provider = String(
    env.aiProvider || "auto"
  ).toLowerCase();

  // ============================================================
  // GEMINI ONLY
  // ============================================================

  if (provider === "gemini") {
    console.log("AI Provider: Gemini");

    return await askGemini({
      systemPrompt,
      question,
    });
  }

  // ============================================================
  // OPENROUTER ONLY
  // ============================================================

  if (provider === "openrouter") {
    console.log("AI Provider: OpenRouter");

    return await askOpenRouter({
      systemPrompt,
      question,
    });
  }

  // ============================================================
  // AUTO
  // ============================================================

  console.log("AI Provider: AUTO");

  try {
    console.log("Trying Gemini...");

    return await askGemini({
      systemPrompt,
      question,
    });
  } catch (geminiError) {
    console.error(
      "Gemini failed:",
      geminiError.message
    );

    console.log(
      "Falling back to OpenRouter..."
    );

    try {
      return await askOpenRouter({
        systemPrompt,
        question,
      });
    } catch (openRouterError) {
      console.error(
        "OpenRouter failed:",
        openRouterError.message
      );

      throw new Error(
        `Both AI providers failed. Gemini: ${geminiError.message}. OpenRouter: ${openRouterError.message}`
      );
    }
  }
};

// ============================================================
// ASK QUESTION
// ============================================================

const askQuestion = async (userId, question) => {
  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  const cleanQuestion = question.trim();

  // ============================================================
  // EMPLOYEE
  // ============================================================

  console.log(
    "Getting employee context for user:",
    userId
  );

  const employeeContext =
    await getEmployeeContext(userId);

  if (!employeeContext) {
    throw new Error("Employee information not found.");
  }

  console.log(
    "Employee:",
    `${employeeContext.firstName || ""} ${employeeContext.lastName || ""}`.trim()
  );

  // ============================================================
  // ATTENDANCE
  // ============================================================

  console.log(
    "Getting attendance for user:",
    userId
  );

  const attendanceEvents =
    await getAttendanceContext(userId);

  console.log(
    "Attendance records found:",
    attendanceEvents.length
  );

  const dailyAttendance =
    buildDailyAttendance(attendanceEvents);

  const attendanceContext =
    formatAttendanceContext(dailyAttendance);

  // ============================================================
  // LEAVES
  // ============================================================

  console.log(
    "Getting leave records for user:",
    userId
  );

  const leaveRecords =
    await getLeaveContext(userId);

  console.log(
    "Leave records found:",
    leaveRecords.length
  );

  const leaveContext =
    formatLeaveContext(leaveRecords);

  // ============================================================
  // DEPARTMENT TEAM LEADS / MANAGERS
  // ============================================================

  const departmentManagement =
    await getDepartmentTeamLeads(
      employeeContext.departmentId
    );

  console.log(
    "Department leads/managers found:",
    departmentManagement.length
  );

  // THIS LINE IS THE IMPORTANT FIX
  const departmentManagementContext =
    formatDepartmentManagementContext(
      departmentManagement
    );

  // ============================================================
  // COMPANY RULES
  // ============================================================

  const systemRules =
    employeeAiRules.getSystemInstructions();

  // ============================================================
  // BUILD AI PROMPT
  // ============================================================

  const systemPrompt = `
${systemRules}

============================================================
COMPANY OFFICE RULES
============================================================

Office check-in:
${employeeAiRules.office.checkInTime}

Office check-out:
${employeeAiRules.office.checkOutTime}

Late after:
${employeeAiRules.office.lateAfter}

Timezone:
${employeeAiRules.office.timezone}

============================================================
OFFICIAL HR CONTACT
============================================================

Name:
${employeeAiRules.hr.name}

Email:
${employeeAiRules.hr.email}

IMPORTANT:
For questions asking which HR employee to contact,
ALWAYS use the official HR contact above.

Do NOT list random users from the database as HR contacts.

============================================================
LEAVE POLICIES
============================================================

Annual Paid Leave:
${employeeAiRules.leavePolicies.annualPaid}

Sick Leave:
${employeeAiRules.leavePolicies.sick}

Casual Leave:
${employeeAiRules.leavePolicies.casual}

Unpaid Leave:
${
  employeeAiRules.leavePolicies.unpaid === null
    ? "Not specified"
    : employeeAiRules.leavePolicies.unpaid
}

Maternity Leave:
${
  employeeAiRules.leavePolicies.maternity === null
    ? "Not specified"
    : employeeAiRules.leavePolicies.maternity
}

Paternity Leave:
${
  employeeAiRules.leavePolicies.paternity === null
    ? "Not specified"
    : employeeAiRules.leavePolicies.paternity
}

============================================================
CURRENT EMPLOYEE
============================================================

${JSON.stringify(employeeContext, null, 2)}

============================================================
ATTENDANCE DATA
============================================================

${
  attendanceContext ||
  "No attendance records found."
}

============================================================
LEAVE DATA
============================================================

${
  leaveContext ||
  "No leave records found."
}

============================================================
TEAM LEADS / MANAGERS IN EMPLOYEE'S DEPARTMENT
============================================================

${
  departmentManagementContext ||
  "No Team Leads or Managers found."
}

============================================================
STRICT ANSWERING RULES
============================================================

1. Answer only using the employee data and company rules provided above.

2. Never reveal another employee's private information.

3. Never invent attendance records.

4. Never invent leave records.

5. Never invent company policies.

6. For attendance lateness:
   Compare the employee's actual check-in time with the official
   office start time of ${employeeAiRules.office.checkInTime}.

7. If an employee checked in after
   ${employeeAiRules.office.checkInTime},
   explain that the employee was late.

8. Calculate the exact difference between the check-in time
   and office start time when possible.

9. Example:
   Office starts at 10:00 AM.
   Employee checks in at 10:17 AM.
   The employee was 17 minutes late.

10. For leave balances:
    Approved leaves count as used.

11. Pending leaves do NOT count as used.

12. Rejected leaves do NOT count as used.

13. Cancelled leaves do NOT count as used.

14. When asked how many leaves remain,
    calculate the remaining balance.

15. When asked how many leaves were requested,
    count the employee's leave requests.

16. When asked how many team leads or managers exist,
    use ONLY the department management data above.

17. Never use users from another department.

18. When asked which HR to consult for a leave issue,
    return:

    ${employeeAiRules.hr.name}
    ${employeeAiRules.hr.email}

19. Keep the answer concise and easy to understand.

============================================================
USER QUESTION
============================================================

${cleanQuestion}
`;

  // ============================================================
  // AI PROVIDER
  // ============================================================

  const answer = await askAI({
    systemPrompt,
    question: cleanQuestion,
  });

  return {
    answer,
  };
};
// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  askQuestion,
  askAI,

  getEmployeeContext,
  getAttendanceContext,
  getLeaveContext,
  getDepartmentTeamLeads,
  getHRUsers,

  buildDailyAttendance,
  formatAttendanceContext,
  formatLeaveContext,
  calculateLeaveSummary,
  calculateLeaveBalances,

  formatTeamLeadContext,
  formatHRContext,
};