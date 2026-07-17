const { prisma } = require("../../../../database/prisma");


const getSummary = async (scopeWhere = {}) => {
  const targetDate = new Date();

  // Sunday -> Saturday
  if (targetDate.getDay() === 0) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const where = {
    ...scopeWhere,
    attendanceDate: {
      gte: startOfDay,
      lte: endOfDay
    }
  };

  const [total, present, absent, late, leave] = await Promise.all([
    prisma.attendance.count({ where }),

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

const getAttendanceTrend = async (scopeWhere = {}) => {
  const today = new Date();

  // If Sunday, use Saturday
  if (today.getDay() === 0) {
    today.setDate(today.getDate() - 1);
  }

  // Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() - 1));
  monday.setHours(0, 0, 0, 0);

  // Saturday of current week
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);

  const rows = await prisma.attendance.groupBy({
    by: ["attendanceDate"],
    where: {
      ...scopeWhere,
      attendanceDate: {
        gte: monday,
        lte: saturday
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      attendanceDate: "asc"
    }
  });

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const result = week.map(day => ({
    date: day,
    count: 0
  }));

  rows.forEach(row => {
    const day = row.attendanceDate.toLocaleDateString("en-US", {
      weekday: "short"
    });

    const index = week.indexOf(day);

    if (index !== -1) {
      result[index].count = row._count.id;
    }
  });

  return result;
};

const getDepartmentAttendance = async (scopeWhere = {}) => {
  const result = await prisma.attendance.groupBy({
    by: [
      "department"
    ],
    where: {
      ...scopeWhere,
      status: "Present"
    },
    _count: {
      id: true
    }
  });
  return result.map(item => ({
    department: item.department,
    present: item._count.id
  }));
};

const getTopLateEmployees = async (scopeWhere = {}) => {
  const rows = await prisma.attendance.groupBy({
    by: ["userCode", "fullName"],
    where: {
      ...scopeWhere,
      status: "Late"
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: "desc"
      }
    },
    take: 5
  });

  return rows.map(row => ({
    name: row.fullName,
    value: row._count.id
  }));
};

const getRecentAttendance = async (scopeWhere = {}, take = 10) => {
  return prisma.attendance.findMany({
    where: scopeWhere,
    orderBy: [
      {
        attendanceDate: "desc"
      },
      {
        id: "desc"
      }
    ],
    take,
    select: {
      id: true,
      userCode: true,
      fullName: true,
      role: true,
      department: true,
      attendanceDate: true,
      checkIn: true,
      checkOut: true,
      status: true,
      remarks: true
    }
  });
};


module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance,
  getTopLateEmployees,
  getRecentAttendance
};
