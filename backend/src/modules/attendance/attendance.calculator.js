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

// Pair CHECK_IN/CHECK_OUT events chronologically and sum each session's
// duration. Also counts a still-open CHECK_IN (no matching CHECK_OUT yet)
// as ongoing up to "now". This replaces naive first-check-in -> last-checkout
// math, which incorrectly counts breaks between sessions as working time.
const calculatePairedWorkingMinutes = (events) => {
  let totalMinutes = 0;
  let activeCheckIn = null;

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventTime) - new Date(b.eventTime)
  );

  for (const event of sortedEvents) {
    if (event.eventType === "CHECK_IN") {
      activeCheckIn = new Date(event.eventTime);
    }

    if (event.eventType === "CHECK_OUT" && activeCheckIn) {
      const end = new Date(event.eventTime);

      totalMinutes += Math.max(
        0,
        Math.floor((end - activeCheckIn) / 60000)
      );

      activeCheckIn = null;
    }
  }

  if (activeCheckIn) {
    totalMinutes += Math.max(
      0,
      Math.floor((new Date() - activeCheckIn) / 60000)
    );
  }

  return totalMinutes;
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
    calculatePairedWorkingMinutes(events);



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
    const start =  new Date(firstCheckIn.eventTime);
    const end =  new Date(lastCheckOut.eventTime);
    workingMinutes =  Math.floor( (end - start) / 60000 );
  }

  let lateMinutes = 0;
  if(firstCheckIn){
    const checkIn =  new Date(firstCheckIn.eventTime);
    const actualMinutes =checkIn.getHours() * 60 + checkIn.getMinutes();
    const officeStart =timeToMinutes(rules.office.startTime );

    lateMinutes =
      Math.max(
        0,
        actualMinutes -
        officeStart -
        rules.office.graceMinutes
      );
  }

  const overtimeMinutes = Math.max( 0,
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

  const hours =
    Math.floor(minutes / 60);

  const mins =
    minutes % 60;

  return `${hours}h ${String(mins).padStart(2, "0")}m`;

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

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 60000)
  );

};

const calculateEmployeeLiveAttendance = (records) => {
  if (!records || !records.length) {
    return {
      firstCheckIn: null,
      finalCheckOut: null,

      // Keep these too for other dashboard consumers
      checkIn: null,
      checkOut: null,

      workingMinutes: 0,
      workingHours: "0h 00m",

      lateMinutes: 0,
      lateTime: "00:00",

      overtimeMinutes: 0,
      overtimeHours: "0h 00m",

      status: "ABSENT"
    };
  }

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.eventTime) - new Date(b.eventTime)
  );

  /*
   * =========================================================
   * FIND FIRST CHECK-IN
   * =========================================================
   */

  const firstCheckIn = sortedRecords.find(
    (record) =>
      record.eventType === "CHECK_IN"
  );

  /*
   * =========================================================
   * CALCULATE WORKING TIME
   *
   * Every completed session:
   *
   * CHECK_IN -> CHECK_OUT
   *
   * And if the employee is currently checked in:
   *
   * CHECK_IN -> NOW
   *
   * Example:
   *
   * 10:26 CHECK_IN
   * 12:44 CHECK_OUT
   * 13:10 CHECK_IN
   *
   * Total:
   *
   * 10:26 -> 12:44
   * +
   * 13:10 -> NOW
   * =========================================================
   */

  let totalSeconds = 0;
  let activeCheckIn = null;

  for (const record of sortedRecords) {

    if (record.eventType === "CHECK_IN") {
      activeCheckIn = new Date(record.eventTime);
      continue;
    }

    if (
      record.eventType === "CHECK_OUT" &&
      activeCheckIn
    ) {
      const checkOutTime =
        new Date(record.eventTime);

      totalSeconds += Math.max(
        0,
        (checkOutTime - activeCheckIn) / 1000
      );

      // Session is completed
      activeCheckIn = null;
    }
  }

  /*
   * If there is an unmatched CHECK_IN,
   * employee is currently working.
   */
  const currentlyWorking =
    activeCheckIn !== null;

  if (currentlyWorking) {
    const now = new Date();

    totalSeconds += Math.max(
      0,
      (now - activeCheckIn) / 1000
    );
  }

  /*
   * =========================================================
   * CHECK-IN / CHECK-OUT DISPLAY
   * =========================================================
   *
   * IMPORTANT:
   *
   * If latest event is CHECK_IN:
   *
   *     checkOut = null
   *
   * This hides the previous checkout.
   *
   * If latest event is CHECK_OUT:
   *
   *     show that checkout.
   * =========================================================
   */

  const latestEvent =
    sortedRecords[sortedRecords.length - 1];

  let finalCheckOut = null;

  if (
    latestEvent &&
    latestEvent.eventType === "CHECK_OUT"
  ) {
    finalCheckOut = latestEvent.eventTime;
  }

  /*
   * =========================================================
   * LATE CALCULATION
   * =========================================================
   */

  let lateMinutes = 0;

  if (firstCheckIn) {
    const checkInDate =
      new Date(firstCheckIn.eventTime);

    const actualMinutes =
      checkInDate.getHours() * 60 +
      checkInDate.getMinutes();

    const allowed =
      attendanceRules.office.startMinutes +
      attendanceRules.office.graceMinutes;

    lateMinutes = Math.max(
      0,
      actualMinutes - allowed
    );
  }

  /*
   * =========================================================
   * WORKING MINUTES
   * =========================================================
   */

  const workingMinutes =
    Math.floor(totalSeconds / 60);

  /*
   * =========================================================
   * OVERTIME
   * =========================================================
   *
   * Keep your existing overtime logic separately if required.
   * This calculates overtime based on expected working minutes.
   * =========================================================
   */

  const overtimeMinutes =
    Math.max(
      0,
      workingMinutes -
        attendanceRules.office.workingMinutes
    );

  /*
   * =========================================================
   * RETURN
   * =========================================================
   */

  return {
    /*
     * These are used by the employee dashboard.
     */
    firstCheckIn:
      firstCheckIn?.eventTime || null,

    finalCheckOut,

    /*
     * Keep the old names too so other code doesn't break.
     */
    checkIn:
      firstCheckIn?.eventTime || null,

    checkOut:
      finalCheckOut,

    workingMinutes,

    workingHours:
      formatMinutes(workingMinutes),

    lateMinutes,

    lateTime:
      formatHHMM(lateMinutes),

    overtimeMinutes,

    overtimeHours:
      formatMinutes(overtimeMinutes),

    status:
      currentlyWorking
        ? "WORKING"
        : "COMPLETED"
  };
};

module.exports = {
  calculateTodayAttendance,
  calculateWeeklyMinutes,
  calculateWorkingMinutes,
  calculatePairedWorkingMinutes,
  calculateLateMinutes,
  calculateOvertimeMinutes,
  formatMinutes,
  calculateEmployeeLiveAttendance,
  calculateCurrentWorkingMinutes,
};