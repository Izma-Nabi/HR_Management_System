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

const findAllUsersAttendanceForWeek = async (startDate, endDate) => {
  return prisma.$queryRaw`
    SELECT
      users.id AS userId,
      users.userCode AS userCode,
      TRIM(CONCAT_WS(' ', users.firstName, users.lastName)) AS fullName,
      departments.department_name AS department,
      designations.designation_name AS designation,
      summaries.id AS dailyAttendanceId,
      DATE_FORMAT(summaries.attendance_date, '%Y-%m-%d') AS attendanceDate,
      TIME_FORMAT(summaries.first_check_in, '%H:%i:%s') AS firstCheckIn,
      TIME_FORMAT(summaries.last_check_out, '%H:%i:%s') AS finalCheckOut,
      summaries.working_minutes AS workedMinutes,
      summaries.late_minutes AS lateMinutes,
      summaries.early_leave_minutes AS earlyLeaveMinutes,
      summaries.overtime_minutes AS overtimeMinutes,
      CAST(summaries.attendance_status AS CHAR) AS status
    FROM users
    LEFT JOIN departments
      ON departments.id = users.department_id
    LEFT JOIN designations
      ON designations.id = users.designation_id
    LEFT JOIN attendance_summary AS summaries
      ON summaries.user_id = users.id
      AND summaries.attendance_date BETWEEN ${startDate} AND ${endDate}
    WHERE users.employmentStatus = 'ACTIVE'
    ORDER BY users.firstName ASC, users.lastName ASC, summaries.attendance_date ASC
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
      id
    },
    data: {
      status: data.status,
      reviewNote: data.reviewNote,
      reviewedAt: new Date()
    }
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

  const attendanceDate = complaint.attendanceDate.toISOString().slice(0, 10);

  let eventType;
  let timeValue;

  if (checkIn) {
    eventType = "CHECK_IN";
    timeValue = checkIn; // "HH:mm"
  } else if (checkOut) {
    eventType = "CHECK_OUT";
    timeValue = checkOut;
  }

  return prisma.$transaction(async (tx) => {

    let attendanceRecord;

    const existingAttendance = complaint.rawAttendance;

    /**
     * CASE 1:
     * Edit existing attendance record
     */
    if (existingAttendance) {

      if (eventType && timeValue) {

        await tx.$executeRaw`
          UPDATE attendance
          SET
            event_type = ${eventType},
            event_time = STR_TO_DATE(${`${attendanceDate} ${timeValue}:00`}, '%Y-%m-%d %H:%i:%s'),
            remarks = ${remarks || existingAttendance.remarks},
            updated_at = ${pakistanNowSql()}
          WHERE id = ${existingAttendance.id}
        `;

      } else {

        // Only remarks changed, no time edit submitted
        await tx.$executeRaw`
          UPDATE attendance
          SET
            remarks = ${remarks || existingAttendance.remarks},
            updated_at = ${pakistanNowSql()}
          WHERE id = ${existingAttendance.id}
        `;

      }

      attendanceRecord = await tx.attendance.findUnique({
        where: { id: existingAttendance.id }
      });

    } else {

      /**
       * CASE 2:
       * Insert new attendance record
       */
      const user = await tx.user.findUnique({
        where: { id: complaint.userId }
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!eventType || !timeValue) {
        throw new Error("Check-in or Check-out time required");
      }

      const sourceKey = `ADMIN_CORRECTION_${Date.now()}`;

      await tx.$executeRaw`
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
        VALUES (
          ${complaint.userId},
          ${user.userCode},
          ${`${user.firstName} ${user.lastName}`},
          ${user.departmentId || null},
          ${user.designationId || null},
          ${attendanceDate},
          ${eventType},
          STR_TO_DATE(${`${attendanceDate} ${timeValue}:00`}, '%Y-%m-%d %H:%i:%s'),
          ${remarks || "Added by admin correction"},
          ${sourceKey},
          ${pakistanNowSql()},
          ${pakistanNowSql()}
        )
      `;

      attendanceRecord = await tx.attendance.findUnique({
        where: { sourceKey }
      });

    }

    /**
     * Apply the manual status override to the daily summary.
     * This is what the "Status" dropdown in the edit form controls —
     * it was previously accepted but never persisted anywhere.
     */
    if (status) {
      await tx.attendanceSummary.update({
        where: { id: complaint.dailyAttendanceId },
        data: {
          attendanceStatus: status
        }
      });
    }

    return attendanceRecord;

  }, {
    timeout: 30000
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

const insertManualAttendance = async ({
  userId,
  attendanceDate,
  eventType,
  eventTime,
  remarks
}) => {
  console.log("Repository input:", {
    userId,
    attendanceDate,
    eventType,
    eventTime,
    remarks
  });

  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId)
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const sourceKey = `ADMIN_MANUAL_${Date.now()}`;

  await prisma.$executeRaw`
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
    VALUES (
      ${user.id},
      ${user.userCode},
      ${`${user.firstName} ${user.lastName}`},
      ${user.departmentId},
      ${user.designationId},
      ${attendanceDate},
      ${eventType},
      STR_TO_DATE(
        ${`${attendanceDate} ${eventTime}:00`},
        '%Y-%m-%d %H:%i:%s'
      ),
      ${remarks || null},
      ${sourceKey},
      ${pakistanNowSql()},
      ${pakistanNowSql()}
    )
  `;

  return prisma.attendance.findUnique({
    where: {
      sourceKey
    }
  });
};


const autoCheckoutEmployees = async () => {

  const users = await prisma.$queryRaw`
    SELECT DISTINCT a.user_id
    FROM attendance a
    WHERE a.event_type = 'CHECK_IN'
      AND DATE(a.attendance_date) = CURDATE()
      AND NOT EXISTS (
        SELECT 1
        FROM attendance b
        WHERE b.user_id = a.user_id
          AND DATE(b.attendance_date) = DATE(a.attendance_date)
          AND b.event_type = 'CHECK_OUT'
      )
  `;

  for (const row of users) {

    const user = await prisma.user.findUnique({
      where: {
        id: row.user_id
      }
    });

    if (!user) {
      continue;
    }

    const sourceKey =
      `AUTO_CHECKOUT_${user.id}_${new Date().toISOString().slice(0, 10)}`;

    await prisma.attendance.create({
      data: {
        userId: user.id,
        userCode: user.userCode,
        fullName: `${user.firstName} ${user.lastName}`,
        departmentId: user.departmentId,
        designationId: user.designationId,
        attendanceDate: new Date(),
        eventType: "CHECK_OUT",
        eventTime: new Date(
          `${new Date().toISOString().slice(0, 10)}T23:59:59`
        ),
        remarks: "Auto checkout - Employee forgot to check out",
        sourceKey
      }
    });

    console.log(
      `Auto checkout created for ${user.userCode}`
    );
  }

};


module.exports = {
  createManyAttendance,
  createComplaint,
  deleteAttendanceByDates,
  findDailyAttendanceByDate,
  findDailyAttendanceById,
  findDailyAttendanceForWeek,
  findAllUsersAttendanceForWeek,
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
  updateAttendanceFromComplaint,
  insertManualAttendance,
  autoCheckoutEmployees
};
