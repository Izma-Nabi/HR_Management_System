const crypto = require("crypto");
const { ApiError } = require("../../utils/apiResponse");
const XLSX = require("xlsx");
const axios = require("axios");
const attendanceRepository = require("./attendance.repository");

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1uNA77aFV8J1Mj8uKKKc0gnOQIXaD0WZ7uYgCWdNQE7w/export?format=xlsx";
const PAKISTAN_TIME_ZONE = "Asia/Karachi";

const padTwo = (value) => {
  return String(value).padStart(2, "0");
};

const isMissing = (value) => {
  return value === null || value === undefined || value === "";
};

const dateFromParts = (year, month, day) => {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
};

const timeFromParts = (hours, minutes = 0, seconds = 0) => {
  return `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}`;
};

const dateStringInPakistan = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`;
};

const dateAtUtcMidnight = (date) => {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

const utcDateString = (date) => {
  return date.toISOString().slice(0, 10);
};

const currentWeek = () => {
  const today = dateStringInPakistan();
  const todayDate = dateAtUtcMidnight(today);
  const daysFromMonday = (todayDate.getUTCDay() + 6) % 7;
  const startDate = new Date(todayDate);

  startDate.setUTCDate(startDate.getUTCDate() - daysFromMonday);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);

    date.setUTCDate(date.getUTCDate() + index);

    return utcDateString(date);
  });

  return {
    today,
    startDate: dates[0],
    endDate: dates[6],
    dates
  };
};

const requestedWeek = (startDate) => {
  if (!startDate) {
    return currentWeek();
  }

  const start = dateAtUtcMidnight(startDate);

  if (
    utcDateString(start) !== startDate ||
    start.getUTCDay() !== 1
  ) {
    throw new ApiError(
      400,
      "startDate must be a valid Monday"
    );
  }

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);

    date.setUTCDate(date.getUTCDate() + index);

    return utcDateString(date);
  });

  return {
    today: dateStringInPakistan(),
    startDate: dates[0],
    endDate: dates[6],
    dates
  };
};

const isDateInCurrentWeek = (date) => {
  const week = currentWeek();

  return date >= week.startDate && date <= week.endDate;
};

const dayNameFromDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC"
  }).format(dateAtUtcMidnight(date));
};

const dateOnlyFromValue = (value) => {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

const databaseInteger = (value) => {
  return typeof value === "bigint" ? Number(value) : value;
};

const isMissingDailyAttendanceTable = (error) => {
  return (
    error?.code === "P2010" &&
    (
      String(error?.meta?.code || "") === "1146" ||
      String(error?.meta?.message || "").includes("daily_attendance")
    )
  );
};

const dailyAttendanceUnavailableError = () => {
  return new ApiError(
    503,
    "Daily attendance processing is not available yet"
  );
};

const normalizeUserCode = (value) => {
  return String(value || "").trim();
};

const userCodeKey = (value) => {
  return normalizeUserCode(value).toUpperCase();
};

const ATTENDANCE_EVENT_TYPES = new Set([
  "CHECK_IN",
  "CHECK_OUT",
  "BREAK_START",
  "BREAK_END"
]);

const EVENT_TYPE_ALIASES = new Map([
  ["CHECKIN", "CHECK_IN"],
  ["CHECK_IN", "CHECK_IN"],
  ["IN", "CHECK_IN"],
  ["CHECKOUT", "CHECK_OUT"],
  ["CHECK_OUT", "CHECK_OUT"],
  ["OUT", "CHECK_OUT"],
  ["BREAKSTART", "BREAK_START"],
  ["BREAK_START", "BREAK_START"],
  ["BREAKEND", "BREAK_END"],
  ["BREAK_END", "BREAK_END"]
]);

const normalizeEventType = (value) => {
  if (isMissing(value)) {
    return null;
  }

  const key = String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return EVENT_TYPE_ALIASES.get(key) || (ATTENDANCE_EVENT_TYPES.has(key) ? key : null);
};

const sourceHashFromRecord = (record) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify([
      record.userId,
      record.attendanceDate,
      record.eventType,
      record.eventTime,
      record.remarks || ""
    ]))
    .digest("hex")
    .slice(0, 48);
};

const parseExcelDate = (value) => {
  if (isMissing(value)) return null;

  if (value instanceof Date) {
    return dateFromParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate()
    );
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    return dateFromParts(
      parsed.y,
      parsed.m,
      parsed.d
    );
  }

  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    return dateFromParts(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3])
    );
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    return dateFromParts(
      Number(slashMatch[3]),
      Number(slashMatch[1]),
      Number(slashMatch[2])
    );
  }

  const parsed = new Date(text);

  if (isNaN(parsed.getTime())) {
    return null;
  }

  return dateFromParts(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    parsed.getDate()
  );
};

const parseExcelTime = (value) => {
  if (isMissing(value)) return null;

  if (value instanceof Date) {
    return timeFromParts(
      value.getHours(),
      value.getMinutes(),
      value.getSeconds()
    );
  }

  if (typeof value === "number") {
    const totalSeconds = Math.round(value * 24 * 60 * 60);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return timeFromParts(
      hours,
      minutes,
      seconds
    );
  }

  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  const meridiem = match[4]?.toUpperCase();

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  if (meridiem === "PM" && hours < 12) {
    hours += 12;
  }

  return timeFromParts(hours, minutes, seconds);
};

const validateRow = (row, rowNumber) => {

  if (!normalizeUserCode(row["User Code"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: User Code is required.`
    );
  }

  if (isMissing(row["Date"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Date is required.`
    );
  }
};

const eventsFromRow = (row, rowNumber) => {
  const eventTypeValue = row["Event Type"];
  const eventTimeValue = row["Event Time"];
  const usesEventRowFormat =
    !isMissing(eventTypeValue) ||
    !isMissing(eventTimeValue);

  if (usesEventRowFormat) {
    const eventType = normalizeEventType(eventTypeValue);

    if (!eventType) {
      throw new ApiError(
        400,
        `Row ${rowNumber}: Event Type must be CHECK_IN, CHECK_OUT, BREAK_START, or BREAK_END.`
      );
    }

    const time = parseExcelTime(eventTimeValue);

    if (!time) {
      throw new ApiError(
        400,
        `Row ${rowNumber}: Event Time is required and must be a valid time.`
      );
    }

    return [
      {
        eventType,
        time
      }
    ];
  }

  return [
    {
      eventType: "CHECK_IN",
      time: parseExcelTime(row["Check-In"])
    },
    {
      eventType: "CHECK_OUT",
      time: parseExcelTime(row["Check-Out"])
    }
  ].filter((event) => event.time);
};


const importAttendance = async () => {
  const response = await axios.get(GOOGLE_SHEET_URL, {
    responseType: "arraybuffer"
  });

  const workbook = XLSX.read(response.data, {
    type: "buffer"
  });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true
  });

  if (!rows.length) {
    return {
      totalRows: 0,
      insertedRows: 0
    };
  }

  const parsedRows = [];
  const sourceHashCounts = new Map();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];

    validateRow(row, index + 2);

    const attendanceDate = parseExcelDate(row["Date"]);

    if (!attendanceDate) {
      throw new ApiError(
        400,
        `Row ${index + 2}: Invalid Date.`
      );
    }

    parsedRows.push({
      row,
      rowNumber: index + 2,
      userCode: normalizeUserCode(row["User Code"]),
      attendanceDate
    });
  }

  const users = await attendanceRepository.findUsersByCodes(
    parsedRows.map((row) => row.userCode)
  );
  const usersByCode = new Map(
    users.map((user) => [userCodeKey(user.userCode), user])
  );
  const attendanceRecords = [];

  for (const parsedRow of parsedRows) {
    const row = parsedRow.row;
    const user = usersByCode.get(userCodeKey(parsedRow.userCode));

    if (!user) {
      throw new ApiError(
        400,
        `Row ${parsedRow.rowNumber}: User Code '${parsedRow.userCode}' does not match any user.`
      );
    }

    const eventTimes = eventsFromRow(row, parsedRow.rowNumber);

    for (const event of eventTimes) {
      const attendanceRecord = {
        userId: user.id,
        userCode: user.userCode,
        fullName: [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || user.userCode,
        departmentId: user.departmentId,
        designationId: user.designationId,
        attendanceDate: parsedRow.attendanceDate,
        eventType: event.eventType,
        eventTime: `${parsedRow.attendanceDate} ${event.time}`,
        remarks: row["Remarks"]?.toString().trim() || null
      };
      const sourceHash = sourceHashFromRecord(attendanceRecord);
      const sourceOccurrence = (sourceHashCounts.get(sourceHash) || 0) + 1;

      sourceHashCounts.set(sourceHash, sourceOccurrence);
      attendanceRecord.sourceKey = `${sourceHash}:${sourceOccurrence}`;

      attendanceRecords.push(attendanceRecord);
    }
  }

  const result = await attendanceRepository.syncNewAttendance(attendanceRecords);

  return {
    totalRows: rows.length,
    totalEvents: attendanceRecords.length,
    insertedRows: result.insertedRows,
    matchedRows: result.matchedRows,
    skippedRows: result.skippedRows
  };
};

const getMyCurrentWeek = async (userId, startDate) => {
  const week = requestedWeek(startDate);
  let summaries;

  try {
    summaries = await attendanceRepository.findDailyAttendanceForWeek(
      userId,
      week.startDate,
      week.endDate
    );
  } catch (error) {
    if (isMissingDailyAttendanceTable(error)) {
      throw dailyAttendanceUnavailableError();
    }

    throw error;
  }

  const summaryByDate = new Map(
    summaries.map((summary) => [summary.attendanceDate, summary])
  );

  const days = week.dates.map((attendanceDate) => {
    const summary = summaryByDate.get(attendanceDate);
    const dayName = dayNameFromDate(attendanceDate);
    let status = summary?.status || "NO_RECORD";

    if (!summary && attendanceDate > week.today) {
      status = "UPCOMING";
    } else if (!summary && ["Saturday", "Sunday"].includes(dayName)) {
      status = "WEEKEND";
    }

    return {
      dailyAttendanceId: summary ? databaseInteger(summary.id) : null,
      attendanceDate,
      dayName,
      firstCheckIn: summary?.firstCheckIn || null,
      finalCheckOut: summary?.finalCheckOut || null,
      workedMinutes: summary
        ? databaseInteger(summary.workedMinutes)
        : null,
      lateMinutes: summary
        ? databaseInteger(summary.lateMinutes)
        : null,
      earlyLeaveMinutes: summary
        ? databaseInteger(summary.earlyLeaveMinutes)
        : null,
      overtimeMinutes: summary
        ? databaseInteger(summary.overtimeMinutes)
        : null,
      status,
      source: summary?.source || null,
      adjustmentReason: summary?.adjustmentReason || null,
      canComplain: Boolean(
        summary &&
        isDateInCurrentWeek(attendanceDate) &&
        attendanceDate <= week.today
      )
    };
  });

  return {
    weekStart: week.startDate,
    weekEnd: week.endDate,
    today: week.today,
    isCurrentWeek: week.startDate === currentWeek().startDate,
    days
  };
};

const getMyDayDetails = async (userId, attendanceDate) => {
  let dailyAttendance;

  try {
    dailyAttendance = await attendanceRepository.findDailyAttendanceByDate(
      userId,
      attendanceDate
    );
  } catch (error) {
    if (isMissingDailyAttendanceTable(error)) {
      throw dailyAttendanceUnavailableError();
    }

    throw error;
  }

  const rawRecords = await attendanceRepository.findRawAttendanceForDay(
    userId,
    attendanceDate
  );
  const complaints = await attendanceRepository.findLatestComplaintsForRawAttendance(
    userId,
    rawRecords.map((record) => databaseInteger(record.id))
  );
  const latestComplaintByRawId = new Map();

  for (const complaint of complaints) {
    if (!latestComplaintByRawId.has(complaint.rawAttendanceId)) {
      latestComplaintByRawId.set(complaint.rawAttendanceId, complaint);
    }
  }

  const week = currentWeek();

  return {
    attendanceDate,
    dailyAttendanceId: dailyAttendance
      ? databaseInteger(dailyAttendance.id)
      : null,
    canComplain: Boolean(
      dailyAttendance &&
      isDateInCurrentWeek(attendanceDate) &&
      attendanceDate <= week.today
    ),
    records: rawRecords.map((record) => ({
      ...record,
      id: databaseInteger(record.id),
      userId: databaseInteger(record.userId),
      complaint: latestComplaintByRawId.get(
        databaseInteger(record.id)
      ) || null
    }))
  };
};

const createAttendanceComplaint = async (userId, input) => {
  let dailyAttendance;

  try {
    dailyAttendance = await attendanceRepository.findDailyAttendanceById(
      input.dailyAttendanceId,
      userId
    );
  } catch (error) {
    if (isMissingDailyAttendanceTable(error)) {
      throw dailyAttendanceUnavailableError();
    }

    throw error;
  }

  if (!dailyAttendance) {
    throw new ApiError(
      404,
      "The selected daily attendance record was not found"
    );
  }

  const attendanceDate = dailyAttendance.attendanceDate;
  const week = currentWeek();

  if (
    !isDateInCurrentWeek(attendanceDate) ||
    attendanceDate > week.today
  ) {
    throw new ApiError(
      400,
      "Attendance complaints can only be submitted for the current week"
    );
  }

  const rawAttendance = await attendanceRepository.findRawAttendanceById(
    input.rawAttendanceId,
    userId,
    attendanceDate
  );

  if (!rawAttendance) {
    throw new ApiError(
      404,
      "The selected check-in/check-out record was not found"
    );
  }

  const pendingComplaint = await attendanceRepository.findPendingComplaint(
    userId,
    databaseInteger(rawAttendance.id),
    input.complaintType
  );

  if (pendingComplaint) {
    throw new ApiError(
      409,
      "A pending complaint of this type already exists for the selected record"
    );
  }

  const complaint = await attendanceRepository.createComplaint({
    userId,
    dailyAttendanceId: databaseInteger(dailyAttendance.id),
    rawAttendanceId: databaseInteger(rawAttendance.id),
    attendanceDate: dateAtUtcMidnight(attendanceDate),
    complaintType: input.complaintType,
    reason: input.reason
  });

  return {
    ...complaint,
    attendanceDate: dateOnlyFromValue(complaint.attendanceDate)
  };
};

module.exports = {
  createAttendanceComplaint,
  getMyCurrentWeek,
  getMyDayDetails,
  importAttendance
};
