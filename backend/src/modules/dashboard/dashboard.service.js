const dashboardRepository = require("./dashboard.repository");
const attendanceCalculator = require("../attendance/attendance.calculator");
const attendanceRules = require("../../config/attendance.config");

const hasPermission = (user, permission) => {
  return (
    Array.isArray(user?.permissions) && 
    user.permissions.includes(permission)
  );
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
  const departmentNames =
    (user?.managedDepartments || [])
      .map(
        (department) => department.departmentName
      )
      .filter(Boolean);

  return {
    department: {
      in: departmentNames
    }
  };
};


const getEmployeeAttendance = async (user) => {

  const todayAttendance =
    await dashboardRepository.getEmployeeTodayAttendance(
      user.id
    );

  const today =
    attendanceCalculator.calculateEmployeeLiveAttendance(
      todayAttendance
    );

  return {

    today,

    entries:
todayAttendance.filter(
  (item, index, array) =>
    index ===
    array.findIndex(
      x =>
        x.eventType === item.eventType
    )
)

  };

};

const getDashboard = async (user) => {
  const sections = {};


  /*
    SUPER ADMIN / ADMIN DASHBOARD
  */

  if (hasPermission(user, "VIEW_SYSTEM_SUMMARY")) {
    const systemAttendance =
      await getAttendanceBundle();


    sections.systemSummary =
      systemAttendance.summary;


    sections.attendanceTrend =
      systemAttendance.attendanceTrend;


    sections.departmentAttendance =
      systemAttendance.departmentAttendance;


    sections.topLateEmployees =
      systemAttendance.topLateEmployees;


    sections.recentAttendance =
      systemAttendance.recentAttendance;
  }


  /*
    TEAM LEAD DASHBOARD
  */

  if (hasPermission(user, "VIEW_TEAM_ATTENDANCE")) {
    sections.teamAttendance =
      await getAttendanceBundle(
        teamScopeFromUser(user)
      );
  }


  /*
    EMPLOYEE LIVE ATTENDANCE DASHBOARD
  */

  if (hasPermission(user, "VIEW_OWN_ATTENDANCE")) {
    const employeeAttendance =
      await getEmployeeAttendance(user);

    sections.employeeAttendance = employeeAttendance;
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions
    },

    sections
  };
};


module.exports = {
  getDashboard
};