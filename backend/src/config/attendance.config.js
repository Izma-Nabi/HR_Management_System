const timeToMinutes = (time) => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const startTime = "10:00 AM";
const endTime = "06:00 PM";

module.exports = {
  office: {
    startTime,
    endTime,
    startMinutes: timeToMinutes(startTime),
    endMinutes: timeToMinutes(endTime),
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
