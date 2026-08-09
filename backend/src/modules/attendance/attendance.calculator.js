const { prisma } = require("../../../../database/prisma");
const attendanceRules = require("../../config/attendance.config");

const PAKISTAN_TIME_ZONE = "Asia/Karachi";

const dateStringInPakistan = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const previousPakistanDate = (date = new Date()) => {
  const today = new Date(`${dateStringInPakistan(date)}T00:00:00.000Z`);

  today.setUTCDate(today.getUTCDate() - 1);

  return today.toISOString().slice(0, 10);
};

const attendanceDateValue = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    throw new Error("Attendance date must use YYYY-MM-DD format.");
  }

  const value = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== date) {
    throw new Error("Attendance date is invalid.");
  }

  return value;
};

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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PAKISTAN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return Number(values.hour) * 60 + Number(values.minute);
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
  attendanceDate,
  providedEvents = null
) => {
  const events =
    providedEvents ||
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

const generateDailyAttendanceSummaries = async (
  date = previousPakistanDate()
) => {
  const attendanceDate = attendanceDateValue(date);
  const users = await prisma.user.findMany({
    where: {
      employmentStatus: "ACTIVE",
      OR: [
        { status: "ACTIVE" },
        { status: null }
      ]
    },
    select: {
      id: true,
      departmentId: true,
      designationId: true
    }
  });

  if (!users.length) {
    return {
      attendanceDate: date,
      processedUsers: 0,
      preservedReviewedUsers: 0,
      statusCounts: {}
    };
  }

  const userIds = users.map((user) => user.id);
  const [approvedLeaves, events, reviewedSummaries] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        startDate: { lte: attendanceDate },
        endDate: { gte: attendanceDate }
      },
      select: { userId: true }
    }),
    prisma.attendance.findMany({
      where: {
        userId: { in: userIds },
        attendanceDate
      },
      orderBy: [
        { userId: "asc" },
        { eventTime: "asc" }
      ]
    }),
    prisma.attendanceSummary.findMany({
      where: {
        userId: { in: userIds },
        attendanceDate,
        complaints: {
          some: { status: "APPROVED" }
        }
      },
      select: { userId: true }
    })
  ]);
  const usersOnLeave = new Set(
    approvedLeaves.map((leave) => leave.userId)
  );
  const eventsByUser = new Map();
  const reviewedUserIds = new Set(
    reviewedSummaries.map((summary) => summary.userId)
  );

  for (const event of events) {
    const userEvents = eventsByUser.get(event.userId) || [];

    userEvents.push(event);
    eventsByUser.set(event.userId, userEvents);
  }

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC"
  }).format(attendanceDate).toUpperCase();
  const isWorkingDay = attendanceRules.weekly.workingDays.includes(weekday);
  const summaries = await Promise.all(
    users.map(async (user) => {
      const calculatedSummary = await calculateDailySummary(
        user.id,
        attendanceDate,
        eventsByUser.get(user.id) || []
      );

      if (calculatedSummary) {
        return {
          ...calculatedSummary,
          departmentId: user.departmentId,
          designationId: user.designationId
        };
      }

      const attendanceStatus = usersOnLeave.has(user.id)
        ? "ON_LEAVE"
        : isWorkingDay
          ? "ABSENT"
          : "WEEK_OFF";
      const expectedMinutes = attendanceStatus === "ABSENT"
        ? attendanceRules.office.workingMinutes
        : 0;

      return {
        userId: user.id,
        departmentId: user.departmentId,
        designationId: user.designationId,
        attendanceDate,
        firstCheckIn: null,
        lastCheckOut: null,
        workingMinutes: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        expectedMinutes,
        attendanceStatus,
        remarks:
          attendanceStatus === "ON_LEAVE"
            ? "Approved leave"
            : attendanceStatus === "WEEK_OFF"
              ? "Scheduled week off"
              : "No attendance events recorded",
        calculatedAt: new Date()
      };
    })
  );

  const summariesToPersist = summaries.filter(
    (summary) => !reviewedUserIds.has(summary.userId)
  );

  if (summariesToPersist.length) {
    await prisma.$transaction(
      summariesToPersist.map((summary) =>
        prisma.attendanceSummary.upsert({
          where: {
            userId_attendanceDate: {
              userId: summary.userId,
              attendanceDate: summary.attendanceDate
            }
          },
          update: summary,
          create: summary
        })
      )
    );
  }

  const statusCounts = summariesToPersist.reduce((counts, summary) => {
    counts[summary.attendanceStatus] =
      (counts[summary.attendanceStatus] || 0) + 1;

    return counts;
  }, {});

  return {
    attendanceDate: date,
    processedUsers: summariesToPersist.length,
    preservedReviewedUsers: reviewedUserIds.size,
    statusCounts
  };
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
    (a,b) =>
      new Date(a.eventTime) - new Date(b.eventTime)
  );

  /*
    First check-in only for late calculation
  */
  const firstCheckIn =
    sortedRecords.find(
      (r) =>
        r.eventType === "CHECK_IN"
    );

  /*
    Last checkout
  */
  const lastCheckOut =
    [...sortedRecords]
      .reverse()
      .find(
        (r) =>
          r.eventType === "CHECK_OUT"
      );

  let totalSeconds = 0;
  let overtimeSeconds = 0;
  let activeCheckIn = null;

  // Office end (6 PM) as an actual Date on this attendance day, so we
  // can measure overlap of each session with the post-6PM window.
  const officeEndDate = new Date(
    `${records[0].attendanceDate}T00:00:00`
  );

  officeEndDate.setMinutes(
    officeEndDate.getMinutes() +
    attendanceRules.office.endMinutes
  );

  // How much of a [start, end] session falls after office end (6 PM),
  // regardless of how many total hours were worked that day.
  const overlapWithOvertime = (start, end) => {
    const overtimeStart =
      start > officeEndDate ? start : officeEndDate;

    return Math.max(0, (end - overtimeStart) / 1000);
  };

  /*
    Calculate all working sessions

    IN  -> OUT
    IN  -> OUT
    IN  -> NOW
  */
  for (const record of sortedRecords) {

    if (record.eventType === "CHECK_IN") {
      activeCheckIn = record.eventTime;
    }

    if (
      record.eventType === "CHECK_OUT" &&
      activeCheckIn
    ) {

      const start =
        new Date(
          `${records[0].attendanceDate}T${activeCheckIn}`
        );

      const end =
        new Date(
          `${records[0].attendanceDate}T${record.eventTime}`
        );

      totalSeconds +=
        Math.max(
          0,
          (end - start) / 1000
        );

      overtimeSeconds += overlapWithOvertime(start, end);

      activeCheckIn = null;
    }
  }

  /*
    Still working after last check-in
  */
  if (activeCheckIn) {

    const start =
      new Date(
        `${records[0].attendanceDate}T${activeCheckIn}`
      );

    const now =
      new Date();

    totalSeconds +=
      Math.max(
        0,
        (now - start) / 1000
      );

    overtimeSeconds += overlapWithOvertime(start, now);
  }

  const workingMinutes =
    Math.floor(
      totalSeconds / 60
    );

  /*
    Late calculation ONLY FIRST CHECK-IN
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

    lateMinutes =
      Math.max(
        0,
        actualMinutes - allowed
      );
  }

  /*
    Overtime = time worked after 6 PM (office end), regardless of
    total hours worked that day. Tracked per-session above so it
    correctly counts time from every session that spills past 6 PM,
    not just the most recent one.
  */
  const overtimeMinutes =
    Math.floor(overtimeSeconds / 60);

  return {

    checkIn:
      firstCheckIn?.eventTime || null,

    checkOut:
      lastCheckOut?.eventTime || null,

    workingMinutes,

    workingHours:
      formatMinutes(
        workingMinutes
      ),

    lateMinutes,

    lateTime:
      formatHHMM(
        lateMinutes
      ),

    overtimeMinutes,

    overtimeHours:
      formatMinutes(
        overtimeMinutes
      ),

    status:
      activeCheckIn
        ? "WORKING"
        : "COMPLETED"
  };

};

module.exports = {
  generateAttendanceSummary,
  generateDailyAttendanceSummaries,
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
