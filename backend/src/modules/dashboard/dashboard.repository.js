const { prisma } = require("../../../../database/prisma");

const getSummary = async (where = {}) => {
  const [
    total,
    present,
    absent,
    late,
    leave
  ] = await Promise.all([
    prisma.attendance.count({
      where
    }),

    prisma.attendance.count({
      where: {
        ...where,
        status: "Present"
      }
    }),

    prisma.attendance.count({
      where: {
        ...where,
        status: "Absent"
      }
    }),

    prisma.attendance.count({
      where: {
        ...where,
        status: "Late"
      }
    }),

    prisma.attendance.count({
      where: {
        ...where,
        status: "Leave"
      }
    })
  ]);

  return {
    total,
    present,
    absent,
    late,
    leave
  };
};

const getAttendanceTrend = async () => {
  const trend = await prisma.attendance.groupBy({
    by: ["attendanceDate"],
    _count: {
      id: true
    },
    orderBy: {
      attendanceDate: "asc"
    },
    take: 7
  });

  return trend.map(item => ({
    date: item.attendanceDate.toLocaleDateString("en-US", {
      weekday: "short"
    }),
    count: item._count.id
  }));
};

const getDepartmentAttendance = async () => {
  const rows = await prisma.attendance.groupBy({
    by: ["department"],
    where: {
      status: "Present"
    },
    _count: {
      id: true
    },
    orderBy: {
      department: "asc"
    }
  });

  return rows.map(item => ({
    department: item.department,
    present: item._count.id
  }));
};

module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance
};