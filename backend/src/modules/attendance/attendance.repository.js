/**
 * ==========================================================
 * ADD THESE TO attendance.repository.js
 * (both the two functions below, and the two extra exports
 * at the bottom — the file already exports an object, just
 * merge these keys into it)
 * ==========================================================
 */

const { Prisma } = require("@prisma/client");
const { prisma } = require("../../../../database/prisma");

/**
 * Finds a user by their biometric device id (MB460 identifier).
 * Only the fields the device flow actually needs are selected.
 */
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

/**
 * Inserts an attendance record coming from a biometric device.
 *
 * Idempotent: if a record with the same sourceKey already exists
 * (i.e. the exact same device event was sent twice), the existing
 * record is returned instead of throwing/duplicating.
 */
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
    // P2002 = unique constraint violation on sourceKey -> duplicate device event
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
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

module.exports = {
  // ...keep all existing exports from attendance.repository.js...
  findUserByBiometricId,
  createDeviceAttendance
};
