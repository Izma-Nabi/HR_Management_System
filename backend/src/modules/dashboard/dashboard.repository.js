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
  const conditions = [
    Prisma.sql`a.user_id IS NOT NULL`
  ];

  if (scopeWhere.departmentId?.in) {
    if (!scopeWhere.departmentId.in.length) {
      conditions.push(Prisma.sql`1 = 0`);
    } else {
      conditions.push(Prisma.sql`u.department_id IN (${Prisma.join(scopeWhere.departmentId.in)})`);
    }
  }

  if (scopeWhere.userId) {
    conditions.push(Prisma.sql`a.user_id = ${scopeWhere.userId}`);
  }

  return Prisma.sql`AND ${Prisma.join(conditions, " AND ")}`;
};

const countFromSummary = (value) => {
  return Number(value || 0);
};

const getSummary = async (scopeWhere = {}) => {
  const targetDate = currentAttendanceDateKey();
  const [summary] = await prisma.$queryRaw`
    SELECT
      COUNT(*) AS total,
      SUM(a.status = 'Present') AS present,
      SUM(a.status = 'Absent') AS absent,
      SUM(a.status = 'Late') AS late,
      SUM(a.status = 'Leave') AS leaveCount
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    WHERE a.attendance_date = ${targetDate}
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
      DATE_FORMAT(a.attendance_date, '%a') AS day,
      COUNT(*) AS count
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    WHERE a.attendance_date BETWEEN ${monday} AND ${saturday}
    ${scopeSql(scopeWhere)}
    GROUP BY a.attendance_date
    ORDER BY a.attendance_date ASC
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
  const rows = await prisma.$queryRaw`
    SELECT
      COALESCE(d.department_name, 'Unassigned') AS department,
      COUNT(*) AS present
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    LEFT JOIN departments AS d
      ON d.id = u.department_id
    WHERE a.status = 'Present'
    ${scopeSql(scopeWhere)}
    GROUP BY d.id, d.department_name
    ORDER BY present DESC
  `;

  return rows.map(item => ({
    department: item.department,
    present: Number(item.present || 0)
  }));
};

const getTopLateEmployees = async (scopeWhere = {}) => {
  const rows = await prisma.$queryRaw`
    SELECT
      a.user_id AS userId,
      COALESCE(NULLIF(TRIM(CONCAT(u.firstName, ' ', u.lastName)), ''), u.userCode) AS name,
      COUNT(*) AS value
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    WHERE a.status = 'Late'
    ${scopeSql(scopeWhere)}
    GROUP BY a.user_id, u.firstName, u.lastName, u.userCode
    ORDER BY value DESC
    LIMIT 5
  `;

  return rows.map(row => ({
    name: row.name,
    value: Number(row.value || 0)
  }));
};

const getRecentAttendance = async (scopeWhere = {}, take = 10) => {
  return prisma.$queryRaw`
    SELECT
      a.id,
      u.userCode AS userCode,
      COALESCE(NULLIF(TRIM(CONCAT(u.firstName, ' ', u.lastName)), ''), u.userCode) AS fullName,
      r.role_name AS role,
      COALESCE(d.department_name, 'Unassigned') AS department,
      DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendanceDate,
      TIME_FORMAT(a.check_in, '%H:%i:%s') AS checkIn,
      TIME_FORMAT(a.check_out, '%H:%i:%s') AS checkOut,
      a.status,
      a.remarks
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    JOIN roles AS r
      ON r.id = u.role_id
    LEFT JOIN departments AS d
      ON d.id = u.department_id
    WHERE 1 = 1
    ${scopeSql(scopeWhere)}
    ORDER BY a.attendance_date DESC, a.id DESC
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
