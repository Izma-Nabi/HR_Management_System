const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");
const attendanceCalculator = require("./attendance.calculator");

const pakistanNowSql = () =>
  Prisma.sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`;


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


const exactRecordCondition = (record) => {
  return Prisma.sql`
    (
      user_id = ${record.userId}

      AND attendance_date = ${record.attendanceDate}

      AND event_type = ${record.eventType}

      AND event_time = ${record.eventTime}

      AND ${
        record.remarks === null
          ? Prisma.sql`remarks IS NULL`
          : Prisma.sql`remarks = ${record.remarks}`
      }
    )
  `;
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

    INSERT INTO attendance
    (
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

      WHERE

        user_id = ${record.userId}

        AND attendance_date = ${record.attendanceDate}

        AND event_type = ${record.eventType}

        AND event_time = ${record.eventTime}

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


        matchedRows += await attachSourceKeyToExistingRecord(
          tx,
          record
        );


        insertedRows += await insertAttendanceRecordIfMissing(
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




const findUsersByCodes = async (userCodes) => {

  const codes =
    Array.from(
      new Set(
        userCodes.filter(Boolean)
      )
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

      firstName: true,

      lastName: true,


      departmentId: true,

      designationId: true

    }

  });


};

const getTodayEmployeeEvents = async (userId) => {

  const today = new Date();

  today.setHours(0,0,0,0);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate()+1);

  return prisma.attendance.findMany({

    where:{

      userId,

      attendanceDate:{

        gte:today,

        lt:tomorrow

      }

    },

    orderBy:{

      eventTime:"asc"

    }

  });

};

const getEmployeeAttendance = async (user) => {

  const records =
    await getTodayEmployeeEvents(user.id);

  return attendanceCalculator
    .calculateEmployeeLiveAttendance(records);

};

module.exports = {
  createManyAttendance,
  deleteAttendanceByDates,
  getAttendanceCount,
  syncNewAttendance,
  findUsersByCodes,
  getEmployeeAttendance,
  getTodayEmployeeEvents
};