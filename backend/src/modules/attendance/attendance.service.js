const crypto = require("crypto");
const { ApiError } = require("../../utils/apiResponse");
const XLSX = require("xlsx");
const axios = require("axios");
const attendanceRepository = require("./attendance.repository");

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1uNA77aFV8J1Mj8uKKKc0gnOQIXaD0WZ7uYgCWdNQE7w/export?format=xlsx";

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

const sourceHashFromRecord = (record) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify([
      record.userCode,
      record.fullName,
      record.role,
      record.department,
      record.attendanceDate,
      record.checkIn,
      record.checkOut,
      record.status,
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

const VALID_STATUSES = [
  "Present",
  "Absent",
  "Late",
  "Leave"
];

const validateRow = (row, rowNumber) => {

  if (isMissing(row["User Code"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: User Code is required.`
    );
  }

  if (isMissing(row["Full Name"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Full Name is required.`
    );
  }

  if (isMissing(row["Role"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Role is required.`
    );
  }

  if (isMissing(row["Department"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Department is required.`
    );
  }

  if (isMissing(row["Date"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Date is required.`
    );
  }

  if (!VALID_STATUSES.includes(row["Status"])) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Invalid Status '${row["Status"]}'.`
    );
  }

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

  const attendanceRecords = [];
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

    const attendanceRecord = {
      userCode: row["User Code"].toString().trim(),
      fullName: row["Full Name"].toString().trim(),
      role: row["Role"].toString().trim(),
      department: row["Department"].toString().trim(),
      attendanceDate,
      checkIn: parseExcelTime(row["Check-In"]),
      checkOut: parseExcelTime(row["Check-Out"]),
      status: row["Status"].toString().trim(),
      remarks: row["Remarks"]?.toString().trim() || null
    };

    const sourceHash = sourceHashFromRecord(attendanceRecord);
    const sourceOccurrence = (sourceHashCounts.get(sourceHash) || 0) + 1;

    sourceHashCounts.set(sourceHash, sourceOccurrence);

    attendanceRecord.sourceKey = `${sourceHash}:${sourceOccurrence}`;

    attendanceRecords.push(attendanceRecord);
  }

  const result = await attendanceRepository.syncNewAttendance(attendanceRecords);

  return {
    totalRows: rows.length,
    insertedRows: result.insertedRows,
    matchedRows: result.matchedRows,
    skippedRows: result.skippedRows
  };
};

module.exports = {
  importAttendance
};
