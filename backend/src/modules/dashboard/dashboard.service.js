const dashboardRepository = require("./dashboard.repository");
const attendanceCalculator = require("../attendance/attendance.calculator");

const hasPermission = (user, permission) => {
  return Array.isArray(user?.permissions) && user.permissions.includes(permission);
};

const withAttendancePercentage = (summary) => {
  const attendancePercentage =
    summary.total === 0
      ? 0
      : Number(
          (
            ((summary.present + summary.late) /
              summary.total) *
            100
          ).toFixed(2)
        );

  return {
    ...summary,
    attendancePercentage
  };
};

const getAttendanceBundle = async (scopeWhere = {}) => {
  const [
    summary,
    attendanceTrend,
    departmentAttendance,
    topLateEmployees,
    recentAttendance
  ] = await Promise.all([
    dashboardRepository.getSummary(scopeWhere),
    dashboardRepository.getAttendanceTrend(scopeWhere),
    dashboardRepository.getDepartmentAttendance(scopeWhere),
    dashboardRepository.getTopLateEmployees(scopeWhere),
    dashboardRepository.getRecentAttendance(scopeWhere)
  ]);

  return {
    summary: withAttendancePercentage(summary),
    attendanceTrend,
    departmentAttendance,
    topLateEmployees,
    recentAttendance
  };
};

const teamScopeFromUser = (user) => {
  const departmentIds = (user?.managedDepartments || [])
    .map((department) => Number(department.id))
    .filter((departmentId) => Number.isInteger(departmentId) && departmentId > 0);

  return {
    departmentId: {
      in: departmentIds
    }
  };
};

const uniqueEntriesByEventType = (records) => {
  return records.filter(
    (record, index, allRecords) =>
      index === allRecords.findIndex(
        (candidate) => candidate.eventType === record.eventType
      )
  );
};

const getEmployeeAttendance = async (user) => {
  const todayAttendance = await dashboardRepository.getEmployeeTodayAttendance(
    user.id
  );

  return {
    today: attendanceCalculator.calculateEmployeeLiveAttendance(todayAttendance),
    entries: uniqueEntriesByEventType(todayAttendance)
  };
};

const getDashboard = async (user) => {
  const sections = {};

  if (hasPermission(user, "VIEW_SYSTEM_SUMMARY")) {
    const systemAttendance = await getAttendanceBundle();

    sections.systemSummary = systemAttendance.summary;
    sections.attendanceTrend = systemAttendance.attendanceTrend;
    sections.departmentAttendance = systemAttendance.departmentAttendance;
    sections.topLateEmployees = systemAttendance.topLateEmployees;
    sections.recentAttendance = systemAttendance.recentAttendance;
  }

  if (hasPermission(user, "VIEW_TEAM_ATTENDANCE")) {
    sections.teamAttendance = await getAttendanceBundle(teamScopeFromUser(user));
  }

  if (hasPermission(user, "VIEW_OWN_ATTENDANCE")) {
    sections.employeeAttendance = await getEmployeeAttendance(user);
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      department: user.department?.departmentName || null,
      permissions: user.permissions
    },
    sections
  };

};

module.exports = {
  getDashboard
};
