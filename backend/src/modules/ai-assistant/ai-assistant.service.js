const prisma = require("../../../../database/prisma");

const getAttendanceContext = async (userId) => {
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: Number(userId),
    },
    orderBy: {
      eventTime: "desc",
    },
    take: 1000,
    select: {
      id: true,
      userId: true,
      userCode: true,
      fullName: true,
      eventType: true,
      eventTime: true,
      remarks: true,
    },
  });

  return attendanceRecords;
};

/**
 * Convert attendance events into daily attendance records.
 *
 * Example:
 *
 * 2026-08-18
 *   CHECK_IN  09:12
 *   CHECK_OUT 17:05
 *
 * becomes:
 *
 * {
 *   date: "2026-08-18",
 *   checkIn: "09:12",
 *   checkOut: "17:05"
 * }
 */
const buildDailyAttendance = (events) => {
  const daily = {};

  for (const event of events) {
    const date = new Date(event.eventTime)
      .toISOString()
      .split("T")[0];

    if (!daily[date]) {
      daily[date] = {
        date,
        checkIn: null,
        checkOut: null,
        events: [],
      };
    }

    const eventType = String(event.eventType).toUpperCase();

    if (eventType === "CHECK_IN") {
      if (
        !daily[date].checkIn ||
        new Date(event.eventTime) <
          new Date(daily[date].checkIn)
      ) {
        daily[date].checkIn = event.eventTime;
      }
    }

    if (eventType === "CHECK_OUT") {
      if (
        !daily[date].checkOut ||
        new Date(event.eventTime) >
          new Date(daily[date].checkOut)
      ) {
        daily[date].checkOut = event.eventTime;
      }
    }

    daily[date].events.push({
      type: eventType,
      time: event.eventTime,
      remarks: event.remarks,
    });
  }

  return Object.values(daily).sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );
};

/**
 * Convert Date object to readable time.
 */
const formatTime = (date) => {
  if (!date) {
    return "Missing";
  }

  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format attendance data into a compact context
 * that can be provided to Gemini/OpenRouter.
 */
const formatAttendanceContext = (dailyAttendance) => {
  return dailyAttendance
    .map((day) => {
      return [
        `Date: ${day.date}`,
        `Check-in: ${formatTime(day.checkIn)}`,
        `Check-out: ${formatTime(day.checkOut)}`,
        `Events: ${day.events
          .map(
            (event) =>
              `${event.type} at ${formatTime(event.time)}`
          )
          .join(", ")}`,
      ].join(" | ");
    })
    .join("\n");
};

/**
 * Ask the AI assistant.
 */
const askQuestion = async (userId, question) => {
  if (!userId) {
    throw new Error("Authenticated user is required.");
  }

  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  const attendanceEvents = await getAttendanceContext(userId);

  const dailyAttendance =
    buildDailyAttendance(attendanceEvents);

  const attendanceContext =
    formatAttendanceContext(dailyAttendance);

  /*
   * Import your AI provider here.
   *
   * Change this according to the provider implementation
   * you currently have.
   */
  const { askGemini } = require("./providers/gemini.provider");

  const systemPrompt = `
You are an AI attendance assistant for an employee.

You can ONLY answer questions using the attendance information
provided below.

IMPORTANT SECURITY RULES:
- The information belongs only to the currently authenticated employee.
- Never ask for or reveal another employee's information.
- Never assume information that is not present in the data.
- Do not invent attendance records.
- If the requested information is not available, clearly say so.
- Do not answer questions unrelated to the employee's attendance.
- Keep answers concise and easy to understand.

Attendance data:

${attendanceContext || "No attendance records found."}
`;

  const answer = await askGemini({
    systemPrompt,
    question: question.trim(),
  });

  return {
    answer,
  };
};

module.exports = {
  askQuestion,
  getAttendanceContext,
  buildDailyAttendance,
  formatAttendanceContext,
};