const { ApiError } = require("../../utils/apiResponse");
const XLSX = require("xlsx");
const axios = require("axios");
const attendanceRepository = require("./attendance.repository");

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1uNA77aFV8J1Mj8uKKKc0gnOQIXaD0WZ7uYgCWdNQE7w/export?format=xlsx";

const parseExcelDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    return new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d
    );
  }

  return new Date(value);
};

const parseExcelTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const totalSeconds = Math.round(value * 24 * 60 * 60);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return new Date(
      1970,
      0,
      1,
      hours,
      minutes,
      seconds
    );
  }

  const date = new Date(`1970-01-01 ${value}`);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const VALID_STATUSES = [
  "Present",
  "Absent",
  "Late",
  "Leave"
];

const validateRow = (row, rowNumber) => {

  if (!row["User Code"]) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: User Code is required.`
    );
  }

  if (!row["Full Name"]) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Full Name is required.`
    );
  }

  if (!row["Role"]) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Role is required.`
    );
  }

  if (!row["Department"]) {
    throw new ApiError(
      400,
      `Row ${rowNumber}: Department is required.`
    );
  }

  if (!row["Date"]) {
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
        defval: null
    });

    if (!rows.length) {
  return {
    totalRows: 0,
    insertedRows: 0
  };
}

const attendanceRecords = [];
const attendanceDates = new Set();

for (let index = 0; index < rows.length; index++) {

  const row = rows[index];

  validateRow(row, index + 2);

  const attendanceDate = parseExcelDate(row["Date"]);

  if (!attendanceDate || isNaN(attendanceDate.getTime())) {
    throw new ApiError(
      400,
      `Row ${index + 2}: Invalid Date.`
    );
  }

  attendanceDates.add(attendanceDate.toISOString().split("T")[0]);

    attendanceRecords.push({
      userCode: row["User Code"].toString().trim(),
      fullName: row["Full Name"].toString().trim(),
      role: row["Role"].toString().trim(),
      department: row["Department"].toString().trim(),
      attendanceDate,
      checkIn: parseExcelTime(row["Check-In"]),
      checkOut: parseExcelTime(row["Check-Out"]),
      status: row["Status"],
      remarks: row["Remarks"]?.toString().trim() || null
    });
  }

  const dates = [...attendanceDates].map(date => new Date(date));

  await attendanceRepository.replaceAttendance(
    dates,
    attendanceRecords
  );

  return {
    totalRows: rows.length,
    insertedRows: attendanceRecords.length
  };
};

module.exports = {
  importAttendance
};