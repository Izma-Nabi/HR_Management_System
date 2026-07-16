const { prisma } = require("../../../../database/prisma");

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


const replaceAttendance = async (dates, records) => {
  return prisma.$transaction(async (tx) => {
    await tx.attendance.deleteMany({
      where: {
        attendanceDate: {
          in: dates
        }
      }
    });

    await tx.attendance.createMany({
      data: records
    });
  });
};

const getAttendanceCount = async () => {
  return prisma.attendance.count();
};

module.exports = {
  createManyAttendance,
  deleteAttendanceByDates,
  getAttendanceCount,
  replaceAttendance
};