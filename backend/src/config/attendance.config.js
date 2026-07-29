module.exports = {
  office: {
    startTime: "10:00 AM",
    endTime: "06:00 PM",

    workingMinutes: 480,

    graceMinutes: 10
  },


  break: {
    enabled: true,

    startTime: "01:00 PM",
    endTime: "02:00 PM",

    durationMinutes: 60
  },


  overtime: {
    enabled: true,

    startsAfterOfficeEnd: true,

    allowedAfterMinutes: 0
  },


  weekly: {
    workingDays: [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY"
    ],

    weeklyExpectedMinutes: 2400
  },


  attendance: {
    halfDayMinutes: 240,

    presentMinutes: 480,

    absentIfNoCheckIn: true
  }
};