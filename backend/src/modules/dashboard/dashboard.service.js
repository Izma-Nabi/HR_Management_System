const dashboardRepository = require("./dashboard.repository");
const getSummary = async (user) => {
  let where = {};

  const summary =
    await dashboardRepository.getSummary(where);

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

const getAttendanceTrend = async () => {
  return await dashboardRepository.getAttendanceTrend();

};

const getDepartmentAttendance = async () => {
  return await dashboardRepository.getDepartmentAttendance();

};

module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance
};