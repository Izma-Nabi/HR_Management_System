const EMPLOYEE_AI_RULES = {
  office: {
    checkInTime: "10:00 AM",
    checkOutTime: "6:00 PM",

    checkInHour: 10,
    checkInMinute: 0,

    checkOutHour: 18,
    checkOutMinute: 0,

    lateAfter: "10:00 AM",

    timezone: "Asia/Karachi",
  },

  // ============================================================
  // OFFICIAL HR
  // ============================================================

  hr: {
    name: "HR Department",
    email: "hr@company.com",
  },

  // ============================================================
  // LEAVE POLICIES
  // ============================================================

  leavePolicies: {
    annualPaid: 14,
    sick: 8,
    casual: 10,

    unpaid: null,
    maternity: null,
    paternity: null,
  },

  // ============================================================
  // LEAVE CALCULATION
  // ============================================================

  leaveCalculation: {
    usedStatuses: [
      "APPROVED",
    ],

    requestedStatuses: [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ],

    pendingStatuses: [
      "PENDING",
    ],
  },

  // ============================================================
  // ATTENDANCE
  // ============================================================

  attendance: {
    lateThresholdMinutes: 0,
    lateIfAfterOfficeStart: true,
    showLateDifference: true,
  },

  // ============================================================
  // DEPARTMENT
  // ============================================================

  department: {
    findManagersFromDepartment: true,
    findTeamLeadsFromDepartment: true,

    teamLeadRoleNames: [
      "TEAM_LEAD",
      "TEAM LEAD",
      "Team Lead",
      "TEAMLEAD",
    ],

    managerRoleNames: [
      "MANAGER",
      "Manager",
      "PROJECT_MANAGER",
      "PROJECT MANAGER",
      "Project Manager",
    ],
  },

  // ============================================================
  // SECURITY
  // ============================================================

  security: {
    onlyAuthenticatedEmployeeData: true,
    preventOtherEmployeeData: true,
    noAttendanceHallucination: true,
    noLeaveHallucination: true,
    useCompanyRulesAsSourceOfTruth: true,
  },

  // ============================================================
  // RESPONSE
  // ============================================================

  response: {
    concise: true,
    performCalculations: true,
    calculateRemainingLeaves: true,
    calculateRequestedLeaves: true,
    calculateUsedLeaves: true,
    calculatePendingLeaves: true,
    calculateLateMinutes: true,
    doNotInventMissingInformation: true,
  },

  // ============================================================
  // SYSTEM INSTRUCTIONS
  // ============================================================

  systemInstructions: [
    "You are an employee AI assistant.",

    "Only answer questions using the employee data and company rules provided to you.",

    "Never reveal private information about another employee.",

    "Never invent attendance records.",

    "Never invent leave records.",

    "Never invent company policies.",

    "For leave issues, direct employees to the official HR contact.",

    "The official HR contact is HR Department at hr@company.com.",

    "For attendance lateness, compare check-in time against the official office start time.",

    "Perform calculations when calculating leave balances.",

    "Approved leaves count as used leaves.",

    "Pending leaves do not count as consumed leaves.",

    "Rejected leaves do not count as consumed leaves.",

    "Cancelled leaves do not count as consumed leaves.",

    "When asked how many leaves remain, calculate the remaining balance.",

    "When asked how many leaves were requested, count the employee's leave requests.",

    "When asked about team leads or managers, use only the employee's department.",

    "Keep responses concise and professional.",
  ],

  // ============================================================
  // HELPERS
  // ============================================================

  getHRContact() {
    return {
      name: this.hr.name,
      email: this.hr.email,
    };
  },

  getOfficeStartMinutes() {
    return (
      this.office.checkInHour * 60 +
      this.office.checkInMinute
    );
  },

  getOfficeEndMinutes() {
    return (
      this.office.checkOutHour * 60 +
      this.office.checkOutMinute
    );
  },

  getMinutesFromDate(date) {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return (
      value.getHours() * 60 +
      value.getMinutes()
    );
  },

  isLate(checkIn) {
    const checkInMinutes =
      this.getMinutesFromDate(checkIn);

    if (checkInMinutes === null) {
      return false;
    }

    return (
      checkInMinutes >
      this.getOfficeStartMinutes()
    );
  },

  calculateLateMinutes(checkIn) {
    const checkInMinutes =
      this.getMinutesFromDate(checkIn);

    if (checkInMinutes === null) {
      return 0;
    }

    const officeStart =
      this.getOfficeStartMinutes();

    if (checkInMinutes <= officeStart) {
      return 0;
    }

    return checkInMinutes - officeStart;
  },

  formatDuration(minutes) {
    if (!minutes || minutes <= 0) {
      return "0 minutes";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} minute${
        remainingMinutes === 1 ? "" : "s"
      }`;
    }

    if (remainingMinutes === 0) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      }`;
    }

    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ${remainingMinutes} minute${
      remainingMinutes === 1 ? "" : "s"
    }`;
  },

  getSystemInstructions() {
    return this.systemInstructions.join("\n");
  },
};

module.exports = EMPLOYEE_AI_RULES;