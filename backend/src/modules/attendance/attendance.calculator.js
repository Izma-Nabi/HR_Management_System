const { prisma } = require("../../../../database/prisma");
const attendanceRules = require("../../config/attendance.config");

const formatHHMM = (minutes) => {

  const h = Math.floor(minutes / 60);

  const m = minutes % 60;

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;

};
// Convert AM/PM time to minutes from midnight
const timeToMinutes = (time) => {
  const [timePart, modifier] = time.split(" ");

  let [hours, minutes] = timePart
    .split(":")
    .map(Number);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};


// Convert Date object to minutes
const dateToMinutes = (date) => {
  return (
    date.getHours() * 60 +
    date.getMinutes()
  );
};


// Difference between minutes
const calculateDifference = (start, end) => {
  return Math.max(
    0,
    end - start
  );
};

const calculateWorkingMinutes = (
  checkIn,
  checkOut
) => {

  if (!checkIn || !checkOut) {
    return 0;
  }


  const start = new Date(checkIn);
  const end = new Date(checkOut);


  return Math.max(
    0,
    Math.floor(
      (end - start) / (1000 * 60)
    )
  );
};

// Get employee events of one day
const getAttendanceEvents = async (
  userId,
  attendanceDate
) => {
  return prisma.attendance.findMany({
    where: {
      userId,
      attendanceDate
    },

    orderBy: {
      eventTime: "asc"
    }
  });
};


const calculateDailySummary = async (
  userId,
  attendanceDate
) => {
  const events =
    await getAttendanceEvents(
      userId,
      attendanceDate
    );


  if (!events.length) {
    return null;
  }


  const firstCheckIn =
    events.find(
      (event) =>
        event.eventType === "CHECK_IN"
    );


  const checkOutEvents =
    events.filter(
      (event) =>
        event.eventType === "CHECK_OUT"
    );


  const lastCheckOut =
    checkOutEvents.length
      ? checkOutEvents[
          checkOutEvents.length - 1
        ]
      : null;


  const workingMinutes =
    calculateWorkingMinutes(events);



  // Rules
  const officeStart =
    timeToMinutes(
      attendanceRules.office.startTime
    );


  const expectedMinutes =
    attendanceRules.office.workingMinutes;



  const actualCheckIn =
    firstCheckIn
      ? dateToMinutes(
          new Date(firstCheckIn.eventTime)
        )
      : null;



  let lateMinutes = 0;


  if (actualCheckIn) {
    const late =
      actualCheckIn -
      officeStart -
      attendanceRules.office.graceMinutes;


    lateMinutes =
      Math.max(
        0,
        late
      );
  }



  const overtimeMinutes =
    Math.max(
      0,
      workingMinutes - expectedMinutes
    );



  let earlyLeaveMinutes = 0;


  if (lastCheckOut) {
    const officeEnd =
      timeToMinutes(
        attendanceRules.office.endTime
      );


    const checkoutMinutes =
      dateToMinutes(
        new Date(lastCheckOut.eventTime)
      );


    if (checkoutMinutes < officeEnd) {
      earlyLeaveMinutes =
        officeEnd -
        checkoutMinutes;
    }
  }



  let attendanceStatus = "PRESENT";


  if (workingMinutes === 0) {
    attendanceStatus = "ABSENT";

  } else if (
    workingMinutes <
    attendanceRules.attendance.halfDayMinutes
  ) {
    attendanceStatus = "HALF_DAY";

  } else if (lateMinutes > 0) {
    attendanceStatus = "LATE";
  }



  return {
    userId,

    attendanceDate,

    firstCheckIn:
      firstCheckIn?.eventTime || null,

    lastCheckOut:
      lastCheckOut?.eventTime || null,

    workingMinutes,

    lateMinutes,

    earlyLeaveMinutes,

    overtimeMinutes,

    expectedMinutes,

    attendanceStatus,

    calculatedAt: new Date()
  };
};



const saveAttendanceSummary = async (summary) => {
  return prisma.attendanceSummary.upsert({
    where: {
      userId_attendanceDate: {
        userId: summary.userId,

        attendanceDate:
          summary.attendanceDate
      }
    },

    update: summary,

    create: summary
  });
};



const generateAttendanceSummary = async (
  userId,
  attendanceDate
) => {
  const summary =
    await calculateDailySummary(
      userId,
      attendanceDate
    );


  if (!summary) {
    return null;
  }


  return saveAttendanceSummary(summary);
};



const calculateLateMinutes = (
  checkIn,
  officeStartMinutes
) => {

  if (!checkIn) {
    return 0;
  }

  const date = new Date(checkIn);

  const actualMinutes =
    date.getHours() * 60 +
    date.getMinutes();


  return Math.max(
    0,
    actualMinutes - officeStartMinutes
  );
};


const calculateOvertimeMinutes = (
  workingMinutes,
  expectedMinutes
) => {

  return Math.max(
    0,
    workingMinutes - expectedMinutes
  );

};

const calculateTodayAttendance = (
  records,
  rules = attendanceRules
) => {

  if (!records || !records.length) {

    return {
      checkIn: null,
      checkOut: null,
      workingMinutes: 0,
      lateMinutes: 0,
      overtimeMinutes: 0
    };

  }


  const firstCheckIn =
    records.find(
      record =>
        record.eventType === "CHECK_IN"
    );


  const checkOutEvents =
    records.filter(
      record =>
        record.eventType === "CHECK_OUT"
    );


  const lastCheckOut =
    checkOutEvents.length
      ? checkOutEvents[checkOutEvents.length - 1]
      : null;



  let workingMinutes = 0;


  if(firstCheckIn && lastCheckOut){

    const start =
      new Date(firstCheckIn.eventTime);


    const end =
      new Date(lastCheckOut.eventTime);


    workingMinutes =
      Math.floor(
        (end - start) / 60000
      );

  }



  let lateMinutes = 0;


  if(firstCheckIn){


    const checkIn =
      new Date(firstCheckIn.eventTime);


    const actualMinutes =
      checkIn.getHours() * 60 +
      checkIn.getMinutes();



    const officeStart =
      timeToMinutes(
        rules.office.startTime
      );



    lateMinutes =
      Math.max(
        0,
        actualMinutes -
        officeStart -
        rules.office.graceMinutes
      );

  }



  const overtimeMinutes =
    Math.max(
      0,
      workingMinutes -
      rules.office.workingMinutes
    );



  return {


    checkIn:
      firstCheckIn?.eventTime || null,


    checkOut:
      lastCheckOut?.eventTime || null,


    workingMinutes,


    lateMinutes,
    overtimeMinutes

  };

};

const calculateWeeklyMinutes = (records) => {

  let totalMinutes = 0;


  for (const record of records) {

    if (
      record.eventType !== "CHECK_IN"
    ) {
      continue;
    }


    const checkOut = records.find(
      item =>
        item.eventType === "CHECK_OUT" &&
        new Date(item.eventTime) >
        new Date(record.eventTime)
    );


    if (checkOut) {

      totalMinutes +=
        calculateWorkingMinutes(
          record.eventTime,
          checkOut.eventTime
        );

    }

  }


  return totalMinutes;
};

const formatMinutes = (minutes) => {

  minutes = Number(minutes || 0);

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;


  return `${hours}h ${remainingMinutes}m`;
};


const calculateCurrentWorkingMinutes = (
  checkIn,
  checkOut = null
) => {

  if (!checkIn) {
    return 0;
  }


  const start = new Date(checkIn);

  const end = checkOut
    ? new Date(checkOut)
    : new Date();


  const diff =
    Math.floor(
      (end - start) / 60000
    );


  return Math.max(0, diff);

};



const calculateEmployeeLiveAttendance = (
  records
) => {


  if (!records.length) {

    return {

      checkIn: null,

      checkOut: null,

      workingMinutes: 0,

      workingHours: "0h 0m",

      lateMinutes: 0,

      overtimeMinutes: 0,

      status: "ABSENT"

    };

  }



  const checkInRecord =
    records.find(
      r => r.eventType === "CHECK_IN"
    );



  const checkOutRecord =
    records
      .filter(
        r => r.eventType === "CHECK_OUT"
      )
      .pop();



let workingMinutes =
  calculateCurrentWorkingMinutes(
    checkInRecord?.eventTime,
    checkOutRecord?.eventTime
  );

if (workingMinutes > 240) {
  workingMinutes -= 60;
}



  const officeStart =
    attendanceRules.office.startMinutes;



  let lateMinutes = 0;



  if(checkInRecord){

    const checkIn =
      new Date(
        checkInRecord.eventTime
      );


    const actualMinutes =
      checkIn.getHours() * 60 +
      checkIn.getMinutes();


    lateMinutes =
      Math.max(
        0,
        actualMinutes -
        officeStart -
        attendanceRules.office.graceMinutes
      );

  }



const overtimeMinutes =
  Math.max(
    0,
    workingMinutes -
    attendanceRules.office.workingMinutes
  );


  let status="WORKING";


  if(checkOutRecord){
    status="COMPLETED";
  }


  return {

    checkIn:
      checkInRecord?.eventTime || null,


    checkOut:
      checkOutRecord?.eventTime || null,


    workingMinutes,


    workingHours:
      formatMinutes(
        workingMinutes
      ),


      lateTime:
      formatHHMM(lateMinutes),

    overtimeMinutes,


    overtimeHours:
      formatMinutes(
        overtimeMinutes
      ),


    status

  };

};

module.exports = {
  calculateTodayAttendance,
  calculateWeeklyMinutes,
  calculateWorkingMinutes,
  calculateLateMinutes,
  calculateOvertimeMinutes,
  formatMinutes,
  calculateEmployeeLiveAttendance,
  calculateCurrentWorkingMinutes,
};