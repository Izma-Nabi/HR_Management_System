const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");
const attendanceRules = require("../../config/attendance.config");

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

const minutesToSqlTime = (minutes) => {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:00`;
};

const lateCutoffTime = minutesToSqlTime(
  attendanceRules.office.startMinutes + attendanceRules.office.graceMinutes
);

const scopeSql = (scopeWhere = {}) => {
  const conditions = [
    Prisma.sql`1 = 1`
  ];

  if (scopeWhere.departmentId?.in) {
    if (!scopeWhere.departmentId.in.length) {
      conditions.push(Prisma.sql`1 = 0`);
    } else {
      conditions.push(Prisma.sql`u.department_id IN (${Prisma.join(scopeWhere.departmentId.in)})`);
    }
  }

  if (scopeWhere.userId) {
    conditions.push(Prisma.sql`u.id = ${scopeWhere.userId}`);
  }

  return Prisma.sql`AND ${Prisma.join(conditions, " AND ")}`;
};

const countFromSummary = (value) => {
  return Number(value || 0);
};

const attendanceEventColumns = () => Prisma.sql`
  a.id,
  a.user_id AS userId,
  a.user_code AS userCode,
  a.biometric_id AS biometricId,
  a.full_name AS fullName,
  a.location_id AS locationId,
  a.department_id AS departmentId,
  a.designation_id AS designationId,
  CAST(a.event_type AS CHAR) AS eventType,
  a.event_time AS eventTime,
  a.remarks,
  a.source_key AS sourceKey,
  a.created_at AS createdAt,
  a.updated_at AS updatedAt
`;

const getEmployeeWeeklyAttendance = async (userId) => {
  const { monday, saturday } = currentWeekRange();

  return prisma.$queryRaw`
    SELECT ${attendanceEventColumns()}
    FROM attendance AS a
    WHERE a.user_id = ${userId}
      AND DATE(a.event_time) BETWEEN ${monday} AND ${saturday}
    ORDER BY a.event_time ASC, a.id ASC
  `;

};

const getSummary = async (scopeWhere = {}) => {
  const targetDate = currentAttendanceDateKey();
  const [summary] = await prisma.$queryRaw`
    SELECT
      COUNT(*) AS total,
      SUM(TIME(daily_checkins.first_check_in) <= ${lateCutoffTime}) AS present,
      0 AS absent,
      SUM(TIME(daily_checkins.first_check_in) > ${lateCutoffTime}) AS late,
      0 AS leaveCount
    FROM (
      SELECT
        a.user_id,
        MIN(a.event_time) AS first_check_in
      FROM attendance AS a
      JOIN users AS u
        ON u.id = a.user_id
      WHERE DATE(a.event_time) = ${targetDate}
        AND a.event_type = 'CHECK_IN'
      ${scopeSql(scopeWhere)}
      GROUP BY a.user_id
    ) AS daily_checkins
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
      DATE_FORMAT(a.event_time, '%a') AS day,
      COUNT(DISTINCT a.user_id) AS count
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    WHERE DATE(a.event_time) BETWEEN ${monday} AND ${saturday}
      AND a.event_type = 'CHECK_IN'
    ${scopeSql(scopeWhere)}
    GROUP BY DATE_FORMAT(a.event_time, '%a')
    ORDER BY MIN(a.event_time) ASC
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
  const targetDate = currentAttendanceDateKey();
  const rows = await prisma.$queryRaw`
    SELECT
      COALESCE(d.department_name, 'Unassigned') AS department,
      COUNT(DISTINCT a.user_id) AS present
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    LEFT JOIN departments AS d
      ON d.id = u.department_id
    WHERE DATE(a.event_time) = ${targetDate}
      AND a.event_type = 'CHECK_IN'
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
  const { monday, saturday } = currentWeekRange();
  const rows = await prisma.$queryRaw`
    SELECT
      late_checkins.user_id AS userId,
      late_checkins.name,
      COUNT(*) AS value
    FROM (
      SELECT
        a.user_id,
        DATE(a.event_time) AS attendance_date,
        COALESCE(NULLIF(TRIM(CONCAT(u.firstName, ' ', u.lastName)), ''), u.userCode) AS name,
        MIN(a.event_time) AS first_check_in
      FROM attendance AS a
      JOIN users AS u
        ON u.id = a.user_id
      WHERE DATE(a.event_time) BETWEEN ${monday} AND ${saturday}
        AND a.event_type = 'CHECK_IN'
      ${scopeSql(scopeWhere)}
      GROUP BY a.user_id, DATE(a.event_time), u.firstName, u.lastName, u.userCode
    ) AS late_checkins
    WHERE TIME(late_checkins.first_check_in) > ${lateCutoffTime}
    GROUP BY late_checkins.user_id, late_checkins.name
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
      DATE_FORMAT(a.event_time, '%Y-%m-%d') AS attendanceDate,
      CASE
        WHEN a.event_type = 'CHECK_IN' THEN TIME_FORMAT(a.event_time, '%H:%i:%s')
        ELSE NULL
      END AS checkIn,
      CASE
        WHEN a.event_type = 'CHECK_OUT' THEN TIME_FORMAT(a.event_time, '%H:%i:%s')
        ELSE NULL
      END AS checkOut,
      CAST(a.event_type AS CHAR) AS status,
      a.remarks
    FROM attendance AS a
    JOIN users AS u
      ON u.id = a.user_id
    JOIN roles AS r
      ON r.id = u.role_id
    LEFT JOIN departments AS d
      ON d.id = u.department_id
    WHERE a.event_type IN ('CHECK_IN', 'CHECK_OUT')
    ${scopeSql(scopeWhere)}
    ORDER BY a.event_time DESC, a.id DESC
    LIMIT ${take}
  `;
};

const getEmployeeTodayAttendance = async (userId) => {
  const today = currentAttendanceDateKey();

  return prisma.$queryRaw`
    SELECT ${attendanceEventColumns()}
    FROM attendance AS a
    WHERE a.user_id = ${userId}
      AND DATE(a.event_time) = ${today}
    ORDER BY a.event_time ASC, a.id ASC
  `;

};
module.exports = {
  getSummary,
  getAttendanceTrend,
  getDepartmentAttendance,
  getTopLateEmployees,
  getRecentAttendance,
  getEmployeeTodayAttendance,
  getEmployeeWeeklyAttendance
};
