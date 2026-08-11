const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const attendanceDeviceService = require("./attendance.device.service");

/**
 * Receives a single attendance event pushed by the MB460
 * (or by the middleware/agent sitting in front of it).
 *
 * Expected body:
 * {
 *   "biometricId": "10025",
 *   "event": "C/In",
 *   "eventTime": "2026-08-11 08:57:21",
 *   "locationId": 1,
 *   "deviceRecordId": "18372"   // optional, if the device provides a stable log id
 * }
 */
const receiveDeviceEvent = asyncHandler(async (req, res) => {
  const result = await attendanceDeviceService.processDeviceAttendanceEvent(
    req.body
  );

  return sendSuccess(res, 201, "Device attendance event processed", result);
});

module.exports = {
  receiveDeviceEvent
};
