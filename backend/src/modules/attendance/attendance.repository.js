const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

const pakistanNowSql = () => Prisma.sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`;

const createManyAttendance = async (records) => {
  return prisma.attendance.createMany({
    data: records
  });
};

const deleteAttendanceByDates = async (dates) => {
  return prisma.attendance.deleteMany({
    where: {
      attendanceDate: {
        in: dates
      }
    }
  });
};


const equalsOrNull = (column, value) => {
  return value === null
    ? Prisma.sql`${Prisma.raw(column)} IS NULL`
    : Prisma.sql`${Prisma.raw(column)} = ${value}`;
};

const exactRecordCondition = (record) => {
  return Prisma.sql`(
    user_code = ${record.userCode}
    AND full_name = ${record.fullName}
    AND role = ${record.role}
    AND department = ${record.department}
    AND attendance_date = ${record.attendanceDate}
    AND ${equalsOrNull("check_in", record.checkIn)}
    AND ${equalsOrNull("check_out", record.checkOut)}
    AND status = ${record.status}
  )`;
};

const attachSourceKeyToExistingRecord = async (tx, record) => {
  const result = await tx.$executeRaw`
    UPDATE attendance
    SET
      source_key = ${record.sourceKey},
      updated_at = ${pakistanNowSql()}
    WHERE source_key IS NULL
      AND ${exactRecordCondition(record)}
    LIMIT 1
  `;

  return Number(result);
};

const insertAttendanceRecordIfMissing = async (tx, record) => {
  const result = await tx.$executeRaw`
    INSERT INTO attendance (
      user_code,
      full_name,
      role,
      department,
      attendance_date,
      check_in,
      check_out,
      status,
      remarks,
      source_key,
      created_at,
      updated_at
    )
    SELECT
      ${record.userCode},
      ${record.fullName},
      ${record.role},
      ${record.department},
      ${record.attendanceDate},
      ${record.checkIn},
      ${record.checkOut},
      ${record.status},
      ${record.remarks},
      ${record.sourceKey},
      ${pakistanNowSql()},
      ${pakistanNowSql()}
    WHERE NOT EXISTS (
      SELECT 1
      FROM attendance
      WHERE source_key = ${record.sourceKey}
    )
  `;

  return Number(result);
};

const syncNewAttendance = async (records) => {
  if (!records.length) {
    return {
      insertedRows: 0,
      skippedRows: 0
    };
  }

  return prisma.$transaction(
    async (tx) => {
      let insertedRows = 0;
      let matchedRows = 0;

      for (const record of records) {
        matchedRows += await attachSourceKeyToExistingRecord(tx, record);
        insertedRows += await insertAttendanceRecordIfMissing(tx, record);
      }

      return {
        insertedRows,
        matchedRows,
        skippedRows: records.length - insertedRows - matchedRows
      };
    },
    {
      timeout: 30000
    }
  );
};

const getAttendanceCount = async () => {
  return prisma.attendance.count();
};

module.exports = {
  createManyAttendance,
  deleteAttendanceByDates,
  getAttendanceCount,
  syncNewAttendance
};
