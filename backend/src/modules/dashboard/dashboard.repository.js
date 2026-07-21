const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

const BUSINESS_TIME_ZONE = "Asia/Karachi";

const datePartsInBusinessTimeZone = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year").value),
    month: Number(parts.find((part) => part.type === "month").value),
    day: Number(parts.find((part) => part.type === "day").value)
  };
};

const dateKeyFromParts = ({ year, month, day }) => {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const dateFromKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

const dateKeyFromDate = (date) => {
  return dateKeyFromParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  });
};

const addDays = (dateKey, days) => {
  const date = dateFromKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return dateKeyFromDate(date);
};

const currentAttendanceDateKey = () => {
  const dateKey = dateKeyFromParts(datePartsInBusinessTimeZone());
  const day = dateFromKey(dateKey).getUTCDay();

  // Sunday -> Saturday
  return day === 0 ? addDays(dateKey, -1) : dateKey;
};

const currentWeekRange = () => {
  const targetDate = currentAttendanceDateKey();
  const day = dateFromKey(targetDate).getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = addDays(targetDate, -daysFromMonday);

  return {
    monday,
    saturday: addDays(monday, 5)
  };
};

const scopeSql = (scopeWhere = {}) => {
  const conditions = [];

  if (scopeWhere.department?.in) {
    if (!scopeWhere.department.in.length) {
      conditions.push(Prisma.sql`1 = 0`);
    } else {
      conditions.push(Prisma.sql`department IN (${Prisma.join(scopeWhere.department.in)})`);
    }
  }

  if (scopeWhere.userCode) {
    conditions.push(Prisma.sql`user_code = ${scopeWhere.userCode}`);
  }

  return conditions.length
    ? Prisma.sql`AND ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
};

const countFromSummary = (value) => {
  return Number(value || 0);
};

const getSummary = async (scopeWhere = {}) => {
  const targetDate = currentAttendanceDateKey();
  const [summary] = await prisma.$queryRaw`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Present') AS present,
      SUM(status = 'Absent') AS absent,
      SUM(status = 'Late') AS late,
      SUM(status = 'Leave') AS leaveCount
    FROM attendance
    WHERE attendance_date = ${targetDate}
    ${scopeSql(scopeWhere)}
  `;

  return {
    total: countFromSummary(summary.total),
    present: countFromSummary(summary.present),
    absent: countFromSummary(summary.absent),
    late: countFromSummary(summary.late),
    leave: countFromSummary(summary.leaveCount)
  };
};

const getAttendanceTrend = async (scopeWhere = {}) => {
  const { monday, saturday } = currentWeekRange();
  const rows = await prisma.$queryRaw`
    SELECT
      DATE_FORMAT(attendance_date, '%a') AS day,
      COUNT(*) AS count
    FROM attendance
    WHERE attendance_date BETWEEN ${monday} AND ${saturday}
    ${scopeSql(scopeWhere)}
    GROUP BY attendance_date
    ORDER BY attendance_date ASC
  `;

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const result = week.map(day => ({
    date: day,
    count: 0
  }));

  rows.forEach(row => {
    const index = week.indexOf(row.day);

    if (index !== -1) {
      result[index].count = Number(row.count || 0);
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
  return prisma.$queryRaw`
    SELECT
      id,
      user_code AS userCode,
      full_name AS fullName,
      role,
      department,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate,
      TIME_FORMAT(check_in, '%H:%i:%s') AS checkIn,
      TIME_FORMAT(check_out, '%H:%i:%s') AS checkOut,
      status,
      remarks
    FROM attendance
    WHERE 1 = 1
    ${scopeSql(scopeWhere)}
    ORDER BY attendance_date DESC, id DESC
    LIMIT ${take}
  `;
};


module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance,
  getTopLateEmployees,
  getRecentAttendance
};
