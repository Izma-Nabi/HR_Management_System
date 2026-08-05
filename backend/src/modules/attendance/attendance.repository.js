const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

const pakistanNowSql = () => Prisma.sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`;

const createManyAttendance = async (records) => {
  return prisma.attendance.createMany({
    data: records
  });
};

const findUsersByCodes = async (userCodes) => {
  const codes = Array.from(new Set(userCodes.filter(Boolean)));

  if (!codes.length) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      userCode: {
        in: codes
      }
    },
    select: {
      id: true,
      userCode: true,
      firstName: true,
      lastName: true,
      departmentId: true,
      designationId: true
    }
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
    user_id = ${record.userId}
    AND attendance_date = ${record.attendanceDate}
    AND event_type = ${record.eventType}
    AND event_time = ${record.eventTime}
    AND ${equalsOrNull("remarks", record.remarks)}
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
      user_id,
      user_code,
      full_name,
      department_id,
      designation_id,
      attendance_date,
      event_type,
      event_time,
      remarks,
      source_key,
      created_at,
      updated_at
    )
    SELECT
      ${record.userId},
      ${record.userCode},
      ${record.fullName},
      ${record.departmentId},
      ${record.designationId},
      ${record.attendanceDate},
      ${record.eventType},
      ${record.eventTime},
      ${record.remarks},
      ${record.sourceKey},
      ${pakistanNowSql()},
      ${pakistanNowSql()}
    WHERE NOT EXISTS (
      SELECT 1
      FROM attendance
      WHERE source_key = ${record.sourceKey}
        OR ${exactRecordCondition(record)}
    )
  `;

  return Number(result);
};

const syncNewAttendance = async (records) => {
  if (!records.length) {
    return {
      insertedRows: 0,
      matchedRows: 0,
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

const findDailyAttendanceForWeek = async (userId, startDate, endDate) => {
  return prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate,
      TIME_FORMAT(first_check_in, '%H:%i:%s') AS firstCheckIn,
      TIME_FORMAT(last_check_out, '%H:%i:%s') AS finalCheckOut,
      working_minutes AS workedMinutes,
      late_minutes AS lateMinutes,
      early_leave_minutes AS earlyLeaveMinutes,
      overtime_minutes AS overtimeMinutes,
      CAST(attendance_status AS CHAR) AS status,
      NULL AS source,
      remarks AS adjustmentReason
    FROM attendance_summary
    WHERE user_id = ${userId}
      AND attendance_date BETWEEN ${startDate} AND ${endDate}
    ORDER BY attendance_date ASC
  `;
};

const findDailyAttendanceByDate = async (userId, attendanceDate) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate,
      TIME_FORMAT(first_check_in, '%H:%i:%s') AS firstCheckIn,
      TIME_FORMAT(last_check_out, '%H:%i:%s') AS finalCheckOut,
      working_minutes AS workedMinutes,
      late_minutes AS lateMinutes,
      early_leave_minutes AS earlyLeaveMinutes,
      overtime_minutes AS overtimeMinutes,
      CAST(attendance_status AS CHAR) AS status,
      NULL AS source,
      remarks AS adjustmentReason
    FROM attendance_summary
    WHERE user_id = ${userId}
      AND attendance_date = ${attendanceDate}
    LIMIT 1
  `;

  return rows[0] || null;
};

const findDailyAttendanceById = async (dailyAttendanceId, userId) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate
    FROM attendance_summary
    WHERE id = ${dailyAttendanceId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] || null;
};

const findRawAttendanceForDay = async (userId, attendanceDate) => {
  return prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      user_code AS userCode,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate,
      CAST(event_type AS CHAR) AS eventType,
      TIME_FORMAT(event_time, '%H:%i:%s') AS eventTime,
      remarks
    FROM attendance
    WHERE user_id = ${userId}
      AND attendance_date = ${attendanceDate}
    ORDER BY event_time ASC, id ASC
  `;
};

const findRawAttendanceById = async (rawAttendanceId, userId, attendanceDate) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(attendance_date, '%Y-%m-%d') AS attendanceDate,
      CAST(event_type AS CHAR) AS eventType,
      TIME_FORMAT(event_time, '%H:%i:%s') AS eventTime,
      remarks
    FROM attendance
    WHERE id = ${rawAttendanceId}
      AND user_id = ${userId}
      AND attendance_date = ${attendanceDate}
    LIMIT 1
  `;

  return rows[0] || null;
};

const findLatestComplaintsForRawAttendance = async (userId, rawAttendanceIds) => {
  if (!rawAttendanceIds.length) {
    return [];
  }

  return prisma.attendanceComplaint.findMany({
    where: {
      userId,
      rawAttendanceId: {
        in: rawAttendanceIds
      }
    },
    select: {
      id: true,
      rawAttendanceId: true,
      complaintType: true,
      reason: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [
      {
        createdAt: "desc"
      },
      {
        id: "desc"
      }
    ]
  });
};

const findPendingComplaint = async (userId, rawAttendanceId, complaintType) => {
  return prisma.attendanceComplaint.findFirst({
    where: {
      userId,
      rawAttendanceId,
      complaintType,
      status: "PENDING"
    },
    select: {
      id: true
    }
  });
};

const createComplaint = async (data) => {
  return prisma.attendanceComplaint.create({
    data,
    select: {
      id: true,
      userId: true,
      dailyAttendanceId: true,
      rawAttendanceId: true,
      attendanceDate: true,
      complaintType: true,
      reason: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

const findAttendanceComplaints = async () => {
  return prisma.attendanceComplaint.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      user: {
        select: {
          id: true,
          userCode: true,
          firstName: true,
          lastName: true,
          department: true,
          designation: true
        }
      },
      rawAttendance: true,
      dailyAttendance: true
    }
  });
};


const findComplaintById = async (id) => {
  return prisma.attendanceComplaint.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      rawAttendance: true,
      dailyAttendance: true
    }
  });
};


const updateComplaintStatus = async (id, data) => {
  return prisma.attendanceComplaint.update({
    where: {
      id: Number(id)
    },
    data
  });
};


const applyAttendanceCorrection = async (complaint) => {

  if (complaint.complaintType === "CHECK_IN") {

    return prisma.attendance.update({
      where: {
        id: complaint.rawAttendanceId
      },
      data: {
        eventType: "CHECK_IN"
      }
    });

  }


  if (complaint.complaintType === "CHECK_OUT") {

    return prisma.attendance.update({
      where: {
        id: complaint.rawAttendanceId
      },
      data: {
        eventType: "CHECK_OUT"
      }
    });

  }


  return null;
};


const updateOrCreateAttendance = async ({
  complaint,
  checkIn,
  checkOut,
  status,
  remarks
}) => {
  const attendanceDate = complaint.attendanceDate
    .toISOString()
    .slice(0, 10);

  const checkInDate = checkIn
    ? new Date(`${attendanceDate} ${checkIn}`)
    : null;

  const checkOutDate = checkOut
    ? new Date(`${attendanceDate} ${checkOut}`)
    : null;

  // CASE 1: Existing attendance found
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      id: complaint.dailyAttendanceId
    }
  });

  if (existingAttendance) {

    return await prisma.attendance.update({

      where:{
        id: existingAttendance.id
      },

      data:{

        eventType:
          checkIn
            ? "CHECK_IN"
            : "CHECK_OUT",

        eventTime:
          checkIn
            ? new Date(`${attendanceDate}T${checkIn}:00`)
            : new Date(`${attendanceDate}T${checkOut}:00`),

        remarks

      }

    });

  }

  // CASE 2: No attendance exists - CREATE NEW RECORD
  return await prisma.dailyAttendance.create({
    data: {
      userId: complaint.userId,

      attendanceDate: complaint.attendanceDate,

      firstCheckIn: checkInDate,

      finalCheckOut: checkOutDate,

      workedMinutes: calculateWorkedMinutes(
        checkInDate,
        checkOutDate
      ),

      lateMinutes: 0,

      earlyLeaveMinutes: 0,

      overtimeMinutes: 0,

      status: status || "Present",

      source: "ADMIN_CORRECTION",

      adjustmentReason:
        remarks || "Created by admin after complaint"
    }
  });
};


const updateAttendanceFromComplaint = async (
  complaint,
  data
) => {

  return prisma.attendance.update({
    where:{
      id: complaint.rawAttendanceId
    },

    data:{
      eventType:
        data.eventType ||
        complaint.rawAttendance.eventType,

      eventTime:
        data.eventTime ||
        complaint.rawAttendance.eventTime,

      remarks:
        data.remarks ||
        complaint.rawAttendance.remarks
    }
  });

};
module.exports = {
  createManyAttendance,
  createComplaint,
  deleteAttendanceByDates,
  findDailyAttendanceByDate,
  findDailyAttendanceById,
  findDailyAttendanceForWeek,
  findLatestComplaintsForRawAttendance,
  findPendingComplaint,
  findRawAttendanceById,
  findRawAttendanceForDay,
  findUsersByCodes,
  getAttendanceCount,
  syncNewAttendance,
  findAttendanceComplaints,
  findComplaintById,
  updateComplaintStatus,
  applyAttendanceCorrection,
  updateOrCreateAttendance,
  updateAttendanceFromComplaint
};
