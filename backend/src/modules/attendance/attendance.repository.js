const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

const pakistanNowSql = () => Prisma.sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`;

const dateKeyFromValue = (value) => {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

const currentPakistanDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const attendanceRecordSelectSql = () => Prisma.sql`
  id,
  user_id AS userId,
  user_code AS userCode,
  biometric_id AS biometricId,
  full_name AS fullName,
  location_id AS locationId,
  department_id AS departmentId,
  designation_id AS designationId,
  CAST(event_type AS CHAR) AS eventType,
  event_time AS eventTime,
  remarks,
  source_key AS sourceKey,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const normalizeAttendanceRecord = (record) => {
  if (!record) {
    return null;
  }

  const numberOrNull = (value) => {
    return value === null || value === undefined
      ? null
      : Number(value);
  };

  return {
    ...record,
    id: Number(record.id),
    userId: Number(record.userId),
    locationId: numberOrNull(record.locationId),
    departmentId: numberOrNull(record.departmentId),
    designationId: numberOrNull(record.designationId)
  };
};

const findAttendanceRecordById = async (client, id) => {
  const rows = await client.$queryRaw`
    SELECT ${attendanceRecordSelectSql()}
    FROM attendance
    WHERE id = ${id}
    LIMIT 1
  `;

  return normalizeAttendanceRecord(rows[0]);
};

const findAttendanceRecordBySourceKey = async (client, sourceKey) => {
  const rows = await client.$queryRaw`
    SELECT ${attendanceRecordSelectSql()}
    FROM attendance
    WHERE source_key = ${sourceKey}
    LIMIT 1
  `;

  return normalizeAttendanceRecord(rows[0]);
};

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
      biometricId: true,
      departmentId: true,
      designationId: true
    }
  });
};

const findUserByBiometricId = async (biometricId) => {
  return prisma.user.findUnique({
    where: {
      biometricId
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

const createDeviceAttendance = async (record) => {
  try {
    return await prisma.attendance.create({
      data: {
        userId: record.userId,
        userCode: record.userCode,
        biometricId: record.biometricId,
        fullName: record.fullName,
        locationId: record.locationId,
        departmentId: record.departmentId,
        designationId: record.designationId,
        eventType: record.eventType,
        eventTime: record.eventTime,
        remarks: record.remarks,
        sourceKey: record.sourceKey
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.attendance.findUnique({
        where: { sourceKey: record.sourceKey }
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
};

const deleteAttendanceByDates = async (dates) => {
  const dateKeys = dates.map(dateKeyFromValue);

  if (!dateKeys.length) {
    return { count: 0 };
  }

  const count = await prisma.$executeRaw`
    DELETE FROM attendance
    WHERE DATE(event_time) IN (${Prisma.join(dateKeys)})
  `;

  return { count: Number(count) };
};


const equalsOrNull = (column, value) => {
  return value === null
    ? Prisma.sql`${Prisma.raw(column)} IS NULL`
    : Prisma.sql`${Prisma.raw(column)} = ${value}`;
};

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
      ${record.locationId || null},
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
      DATE_FORMAT(event_time, '%Y-%m-%d') AS attendanceDate,
      CAST(event_type AS CHAR) AS eventType,
      TIME_FORMAT(event_time, '%H:%i:%s') AS eventTime,
      remarks
    FROM attendance
    WHERE user_id = ${userId}
      AND DATE(event_time) = ${attendanceDate}
    ORDER BY event_time ASC, id ASC
  `;
};

const findRawAttendanceById = async (rawAttendanceId, userId, attendanceDate) => {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      user_id AS userId,
      DATE_FORMAT(event_time, '%Y-%m-%d') AS attendanceDate,
      CAST(event_type AS CHAR) AS eventType,
      TIME_FORMAT(event_time, '%H:%i:%s') AS eventTime,
      remarks
    FROM attendance
    WHERE id = ${rawAttendanceId}
      AND user_id = ${userId}
      AND DATE(event_time) = ${attendanceDate}
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

const deleteAttendanceSummaryForDate = async (userId, attendanceDate) => {
  return prisma.attendanceSummary.deleteMany({
    where: {
      userId,
      attendanceDate
    }
  });
};

const findLatestComplaintsForDates = async (userId, attendanceDates) => {
  if (!attendanceDates.length) {
    return [];
  }

  return prisma.attendanceComplaint.findMany({
    where: {
      userId,
      attendanceDate: {
        in: attendanceDates
      }
    },
    select: {
      id: true,
      attendanceDate: true,
      requestAction: true,
      complaintType: true,
      requestedEventTime: true,
      status: true,
      createdAt: true
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" }
    ]
  });
};

const findPendingComplaint = async (
  userId,
  attendanceDate,
  requestAction,
  complaintType
) => {
  return prisma.attendanceComplaint.findFirst({
    where: {
      userId,
      attendanceDate,
      requestAction,
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
      requestedAttendanceDate: true,
      requestAction: true,
      requestedEventTime: true,
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

const findAttendanceComplaints = async (departmentId = null) => {
  return prisma.attendanceComplaint.findMany({
    where: departmentId
      ? {
          user: {
            departmentId: Number(departmentId)
          }
        }
      : undefined,
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


const findComplaintById = async (id, departmentId = null) => {
  return prisma.attendanceComplaint.findFirst({
    where: {
      id: Number(id),
      ...(departmentId
        ? {
            user: {
              departmentId: Number(departmentId)
            }
          }
        : {})
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
      reviewedAt: new Date(),
      ...(data.requestedAttendanceDate
        ? { requestedAttendanceDate: data.requestedAttendanceDate }
        : {}),
      ...(data.requestedEventTime
        ? { requestedEventTime: data.requestedEventTime }
        : {})
    }
  });
};

const applyAttendanceRequest = async ({
  complaint,
  attendanceDate,
  eventTime,
  reviewNote
}) => {
  const requestedAttendanceDate = new Date(
    `${attendanceDate}T00:00:00.000Z`
  );

  return prisma.$transaction(async (tx) => {
    let attendanceRecord;

    if (complaint.requestAction === "EDIT") {
      if (!complaint.rawAttendanceId) {
        throw new Error("The attendance event to edit no longer exists");
      }

      await tx.$executeRaw`
        UPDATE attendance
        SET
          event_type = ${complaint.complaintType},
          event_time = STR_TO_DATE(
            ${`${attendanceDate} ${eventTime}:00`},
            '%Y-%m-%d %H:%i:%s'
          ),
          updated_at = ${pakistanNowSql()}
        WHERE id = ${complaint.rawAttendanceId}
      `;

      attendanceRecord = await findAttendanceRecordById(
        tx,
        complaint.rawAttendanceId
      );
    } else {
      const user = await tx.user.findUnique({
        where: { id: complaint.userId }
      });

      if (!user) {
        throw new Error("User not found");
      }

      const sourceKey = `ATTENDANCE_REQUEST_${complaint.id}_${Date.now()}`;

      await tx.$executeRaw`
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
        VALUES (
          ${complaint.userId},
          ${user.userCode},
          ${user.biometricId || user.userCode},
          ${`${user.firstName} ${user.lastName}`},
          ${null},
          ${user.departmentId || null},
          ${user.designationId || null},
          ${complaint.complaintType},
          STR_TO_DATE(
            ${`${attendanceDate} ${eventTime}:00`},
            '%Y-%m-%d %H:%i:%s'
          ),
          ${`Added from approved attendance request #${complaint.id}`},
          ${sourceKey},
          ${pakistanNowSql()},
          ${pakistanNowSql()}
        )
      `;

      attendanceRecord = await findAttendanceRecordBySourceKey(tx, sourceKey);
    }

    const updatedComplaint = await tx.attendanceComplaint.update({
      where: { id: complaint.id },
      data: {
        requestedAttendanceDate,
        requestedEventTime: eventTime,
        rawAttendanceId: attendanceRecord.id,
        status: "APPROVED",
        reviewNote: reviewNote || null,
        reviewedAt: new Date()
      }
    });

    return {
      attendance: attendanceRecord,
      complaint: updatedComplaint
    };
  }, {
    timeout: 30000
  });
};

const linkComplaintToSummary = async (complaintId, dailyAttendanceId) => {
  return prisma.attendanceComplaint.update({
    where: { id: complaintId },
    data: { dailyAttendanceId }
  });
};


const applyAttendanceCorrection = async (complaint) => {

  if (complaint.complaintType === "CHECK_IN") {

    await prisma.$executeRaw`
      UPDATE attendance
      SET event_type = 'CHECK_IN', updated_at = ${pakistanNowSql()}
      WHERE id = ${complaint.rawAttendanceId}
    `;

    return findAttendanceRecordById(prisma, complaint.rawAttendanceId);

  }


  if (complaint.complaintType === "CHECK_OUT") {

    await prisma.$executeRaw`
      UPDATE attendance
      SET event_type = 'CHECK_OUT', updated_at = ${pakistanNowSql()}
      WHERE id = ${complaint.rawAttendanceId}
    `;

    return findAttendanceRecordById(prisma, complaint.rawAttendanceId);

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

      attendanceRecord = await findAttendanceRecordById(
        tx,
        existingAttendance.id
      );

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
        VALUES (
          ${complaint.userId},
          ${user.userCode},
          ${user.biometricId || user.userCode},
          ${`${user.firstName} ${user.lastName}`},
          ${null},
          ${user.departmentId || null},
          ${user.designationId || null},
          ${eventType},
          STR_TO_DATE(${`${attendanceDate} ${timeValue}:00`}, '%Y-%m-%d %H:%i:%s'),
          ${remarks || "Added by admin correction"},
          ${sourceKey},
          ${pakistanNowSql()},
          ${pakistanNowSql()}
        )
      `;

      attendanceRecord = await findAttendanceRecordBySourceKey(tx, sourceKey);

    }

    /**
     * Apply the manual status override to the daily summary.
     * This is what the "Status" dropdown in the edit form controls —
     * it was previously accepted but never persisted anywhere.
     */
    if (status && complaint.dailyAttendanceId) {
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

  await prisma.$executeRaw`
    UPDATE attendance
    SET
      event_type = ${data.eventType || complaint.rawAttendance.eventType},
      event_time = ${data.eventTime || complaint.rawAttendance.eventTime},
      remarks = ${data.remarks || complaint.rawAttendance.remarks},
      updated_at = ${pakistanNowSql()}
    WHERE id = ${complaint.rawAttendanceId}
  `;

  return findAttendanceRecordById(prisma, complaint.rawAttendanceId);

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
    VALUES (
      ${user.id},
      ${user.userCode},
      ${user.biometricId || user.userCode},
      ${`${user.firstName} ${user.lastName}`},
      ${null},
      ${user.departmentId},
      ${user.designationId},
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

  return findAttendanceRecordBySourceKey(prisma, sourceKey);
};


const autoCheckoutEmployees = async () => {

  const users = await prisma.$queryRaw`
    SELECT DISTINCT a.user_id
    FROM attendance a
    WHERE a.event_type = 'CHECK_IN'
      AND DATE(a.event_time) = DATE(${pakistanNowSql()})
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
        id: row.user_id
      }
    });

    if (!user) {
      continue;
    }

    const attendanceDate = currentPakistanDateKey();
    const sourceKey = `AUTO_CHECKOUT_${user.id}_${attendanceDate}`;

    await prisma.$executeRaw`
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
      VALUES (
        ${user.id},
        ${user.userCode},
        ${user.biometricId || user.userCode},
        ${`${user.firstName} ${user.lastName}`},
        ${null},
        ${user.departmentId},
        ${user.designationId},
        'CHECK_OUT',
        STR_TO_DATE(${`${attendanceDate} 23:59:59`}, '%Y-%m-%d %H:%i:%s'),
        'Auto checkout - Employee forgot to check out',
        ${sourceKey},
        ${pakistanNowSql()},
        ${pakistanNowSql()}
      )
    `;

    console.log(
      `Auto checkout created for ${user.userCode}`
    );
  }

};


module.exports = {
  createManyAttendance,
  createComplaint,
  deleteAttendanceByDates,
  deleteAttendanceSummaryForDate,
  findDailyAttendanceByDate,
  findDailyAttendanceById,
  findDailyAttendanceForWeek,
  findAllUsersAttendanceForWeek,
  findLatestComplaintsForDates,
  findLatestComplaintsForRawAttendance,
  findPendingComplaint,
  findRawAttendanceById,
  findRawAttendanceForDay,
  findUserByBiometricId,
  findUsersByCodes,
  getAttendanceCount,
  syncNewAttendance,
  createDeviceAttendance,
  findAttendanceComplaints,
  findComplaintById,
  updateComplaintStatus,
  applyAttendanceRequest,
  linkComplaintToSummary,
  applyAttendanceCorrection,
  updateOrCreateAttendance,
  updateAttendanceFromComplaint,
  insertManualAttendance,
  autoCheckoutEmployees
};
