const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

const pakistanNowSql = () =>
  Prisma.sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`;


const createManyAttendance = async (records) => {
  return prisma.attendance.createMany({
    data: records
  });
};


const findUsersByCodes = async (userCodes) => {
  const codes = Array.from(
    new Set(userCodes.filter(Boolean))
  );

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
      biometricId: true,
      firstName: true,
      lastName: true,
      departmentId: true,
      designationId: true
    }
  });
};


/**
 * Delete attendance events for specific dates.
 * Since attendance table does not have attendance_date,
 * filter using event_time.
 */
const deleteAttendanceByDates = async (dates) => {
  if (!dates?.length) {
    return { count: 0 };
  }

  const conditions = dates.map((date) => {
    const start = new Date(`${date}T00:00:00+05:00`);
    const end = new Date(`${date}T00:00:00+05:00`);

    end.setDate(end.getDate() + 1);

    return {
      eventTime: {
        gte: start,
        lt: end
      }
    };
  });

  return prisma.attendance.deleteMany({
    where: {
      OR: conditions
    }
  });
};


const equalsOrNull = (column, value) => {
  return value === null
    ? Prisma.sql`${Prisma.raw(column)} IS NULL`
    : Prisma.sql`${Prisma.raw(column)} = ${value}`;
};


/**
 * Exact attendance event match.
 * event_time already contains both date and time.
 */
const exactRecordCondition = (record) => {
  return Prisma.sql`(
    user_id = ${record.userId}
    AND event_type = ${record.eventType}
    AND event_time = ${record.eventTime}
    AND ${equalsOrNull("remarks", record.remarks)}
  )`;
};


const attachSourceKeyToExistingRecord = async (tx, record) => {


  const result = await tx.$executeRaw`
    UPDATE attendance
    SET
      source_key = ${record.sourceKey}
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
      biometric_id,
      full_name,
      location_id,
      department_id,
      designation_id,
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
      ${record.biometricId},
      ${record.fullName},
      ${record.locationId},
      ${record.departmentId},
      ${record.designationId},
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
        matchedRows +=
          await attachSourceKeyToExistingRecord(
            tx,
            record
          );

        insertedRows +=
          await insertAttendanceRecordIfMissing(
            tx,
            record
          );
      }

      return {
        insertedRows,
        matchedRows,
        skippedRows:
          records.length -
          insertedRows -
          matchedRows
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


/* =========================================================
   ATTENDANCE SUMMARY
   attendance_summary HAS attendance_date
========================================================= */


const findDailyAttendanceForWeek = async (
  userId,
  startDate,
  endDate
) => {
  return prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(
        attendance_date,
        '%Y-%m-%d'
      ) AS attendanceDate,
      TIME_FORMAT(
        first_check_in,
        '%H:%i:%s'
      ) AS firstCheckIn,
      TIME_FORMAT(
        last_check_out,
        '%H:%i:%s'
      ) AS finalCheckOut,
      working_minutes AS workedMinutes,
      late_minutes AS lateMinutes,
      early_leave_minutes AS earlyLeaveMinutes,
      overtime_minutes AS overtimeMinutes,
      CAST(
        attendance_status AS CHAR
      ) AS status,
      NULL AS source,
      remarks AS adjustmentReason
    FROM attendance_summary
    WHERE user_id = ${userId}
      AND attendance_date
        BETWEEN ${startDate} AND ${endDate}
    ORDER BY attendance_date ASC
  `;
};


const findDailyAttendanceByDate = async (
  userId,
  attendanceDate
) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(
        attendance_date,
        '%Y-%m-%d'
      ) AS attendanceDate,
      TIME_FORMAT(
        first_check_in,
        '%H:%i:%s'
      ) AS firstCheckIn,
      TIME_FORMAT(
        last_check_out,
        '%H:%i:%s'
      ) AS finalCheckOut,
      working_minutes AS workedMinutes,
      late_minutes AS lateMinutes,
      early_leave_minutes AS earlyLeaveMinutes,
      overtime_minutes AS overtimeMinutes,
      CAST(
        attendance_status AS CHAR
      ) AS status,
      NULL AS source,
      remarks AS adjustmentReason
    FROM attendance_summary
    WHERE user_id = ${userId}
      AND attendance_date = ${attendanceDate}
    LIMIT 1
  `;

  return rows[0] || null;
};


const findDailyAttendanceById = async (
  dailyAttendanceId,
  userId
) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(
        attendance_date,
        '%Y-%m-%d'
      ) AS attendanceDate
    FROM attendance_summary
    WHERE id = ${dailyAttendanceId}
      AND user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] || null;
};


/* =========================================================
   RAW ATTENDANCE EVENTS
   attendance table uses event_time
========================================================= */


const findRawAttendanceForDay = async (
  userId,
  attendanceDate
) => {
  return prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      user_code AS userCode,

      DATE_FORMAT(
        DATE_ADD(event_time, INTERVAL 5 HOUR),
        '%Y-%m-%d'
      ) AS attendanceDate,

      CAST(
        event_type AS CHAR
      ) AS eventType,

      TIME_FORMAT(
        DATE_ADD(event_time, INTERVAL 5 HOUR),
        '%H:%i:%s'
      ) AS eventTime,

      remarks

    FROM attendance

    WHERE user_id = ${userId}

      AND DATE(
        DATE_ADD(event_time, INTERVAL 5 HOUR)
      ) = ${attendanceDate}

    ORDER BY event_time ASC, id ASC
  `;
};


const findRawAttendanceById = async (
  rawAttendanceId,
  userId,
  attendanceDate
) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(
        event_time,
        '%Y-%m-%d'
      ) AS attendanceDate,
      CAST(
        event_type AS CHAR
      ) AS eventType,
      TIME_FORMAT(
        event_time,
        '%H:%i:%s'
      ) AS eventTime,
      remarks
    FROM attendance
    WHERE id = ${rawAttendanceId}
      AND user_id = ${userId}
      AND DATE(event_time) = ${attendanceDate}
    LIMIT 1
  `;

  return rows[0] || null;
};


const findLatestComplaintsForRawAttendance = async (
  userId,
  rawAttendanceIds
) => {
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


const findPendingComplaint = async (
  userId,
  rawAttendanceId,
  complaintType
) => {
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
      reviewedAt: data.reviewedAt || new Date(),
      reviewedBy: data.reviewedBy || undefined
    }
  });
};


const applyAttendanceCorrection = async (
  complaint
) => {
  if (
    complaint.complaintType === "CHECK_IN"
  ) {
    return prisma.attendance.update({
      where: {
        id: complaint.rawAttendanceId
      },
      data: {
        eventType: "CHECK_IN"
      }
    });
  }

  if (
    complaint.complaintType === "CHECK_OUT"
  ) {
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
  const attendanceDate =
    complaint.attendanceDate
      .toISOString()
      .slice(0, 10);

  let eventType;
  let timeValue;

  if (checkIn) {
    eventType = "CHECK_IN";
    timeValue = checkIn;
  } else if (checkOut) {
    eventType = "CHECK_OUT";
    timeValue = checkOut;
  }

  return prisma.$transaction(
    async (tx) => {
      let attendanceRecord;

      const existingAttendance =
        complaint.rawAttendance;

      if (existingAttendance) {
        if (eventType && timeValue) {
          await tx.$executeRaw`
            UPDATE attendance
            SET
              event_type = ${eventType},
              event_time = STR_TO_DATE(
                ${`${attendanceDate} ${timeValue}:00`},
                '%Y-%m-%d %H:%i:%s'
              ),
              remarks = ${
                remarks ||
                existingAttendance.remarks
              },
              updated_at = ${pakistanNowSql()}
            WHERE id = ${existingAttendance.id}
          `;
        } else {
          await tx.$executeRaw`
            UPDATE attendance
            SET
              remarks = ${
                remarks ||
                existingAttendance.remarks
              },
              updated_at = ${pakistanNowSql()}
            WHERE id = ${existingAttendance.id}
          `;
        }

        attendanceRecord =
          await tx.attendance.findUnique({
            where: {
              id: existingAttendance.id
            }
          });
      } else {
        const user =
          await tx.user.findUnique({
            where: {
              id: complaint.userId
            }
          });

        if (!user) {
          throw new Error("User not found");
        }

        if (!eventType || !timeValue) {
          throw new Error(
            "Check-in or Check-out time required"
          );
        }

        const sourceKey =
          `ADMIN_CORRECTION_${Date.now()}`;

        attendanceRecord =
          await tx.attendance.create({
            data: {
              userId: complaint.userId,
              userCode: user.userCode,
              biometricId:
                user.biometricId ||
                user.userCode,
              fullName:
                `${user.firstName || ""} ${
                  user.lastName || ""
                }`.trim(),
              locationId: null,
              departmentId:
                user.departmentId || null,
              designationId:
                user.designationId || null,
              eventType,
              eventTime: new Date(
                `${attendanceDate}T${timeValue}`
              ),
              remarks:
                remarks ||
                "Added by admin correction",
              sourceKey
            }
          });
      }

      if (status) {
        await tx.attendanceSummary.update({
          where: {
            id: complaint.dailyAttendanceId
          },
          data: {
            attendanceStatus: status
          }
        });
      }

      return attendanceRecord;
    },
    {
      timeout: 30000
    }
  );
};


const updateAttendanceFromComplaint = async (
  complaint,
  data
) => {
  return prisma.attendance.update({
    where: {
      id: complaint.rawAttendanceId
    },
    data: {
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
  const user =
    await prisma.user.findUnique({
      where: {
        id: Number(userId)
      }
    });

  if (!user) {
    throw new Error("User not found");
  }

  const sourceKey =
    `ADMIN_MANUAL_${Date.now()}`;

  return prisma.attendance.create({
    data: {
      userId: user.id,
      userCode: user.userCode,
      biometricId:
        user.biometricId ||
        user.userCode,
      fullName:
        `${user.firstName || ""} ${
          user.lastName || ""
        }`.trim(),
      locationId: null,
      departmentId:
        user.departmentId || null,
      designationId:
        user.designationId || null,
      eventType,
      eventTime: new Date(
        `${attendanceDate}T${eventTime}`
      ),
      remarks: remarks || null,
      sourceKey
    }
  });
};


/**
 * Auto checkout employees who checked in today
 * but never checked out.
 */
const autoCheckoutEmployees = async () => {
  const users = await prisma.$queryRaw`
    SELECT DISTINCT a.user_id
    FROM attendance a
    WHERE a.event_type = 'CHECK_IN'
      AND DATE(a.event_time) = CURDATE()
      AND NOT EXISTS (
        SELECT 1
        FROM attendance b
        WHERE b.user_id = a.user_id
          AND DATE(b.event_time) = DATE(a.event_time)
          AND b.event_type = 'CHECK_OUT'
      )
  `;

  for (const row of users) {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(row.user_id)
      }
    });

    if (!user) {
      continue;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const sourceKey =
      `AUTO_CHECKOUT_${user.id}_${today}`;

    await prisma.attendance.upsert({
      where: {
        sourceKey
      },

      update: {},

      create: {
        userId: user.id,

        userCode: user.userCode,

        // IMPORTANT:
        // Attendance requires biometricId.
        // If User does not have biometricId,
        // userCode is used as fallback.
        biometricId: user.userCode,

        fullName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),

        locationId: null,

        departmentId: user.departmentId || null,

        designationId: user.designationId || null,

        eventType: "CHECK_OUT",

        eventTime: new Date(
          `${today}T23:59:59`
        ),

        remarks:
          "Auto checkout - Employee forgot to check out",

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