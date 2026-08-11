/**
 * ==========================================================
 * ADD THESE TO attendance.routes.js
 * ==========================================================
 */

const attendanceDeviceController = require("./attendance.device.controller");
const deviceAuthMiddleware = require("../../middlewares/device.auth.middleware");
const validateBody = require("../../middlewares/validate.middleware"); // adjust to your actual validate middleware
const attendanceDeviceValidation = require("./attendance.device.validation");

// Biometric device (MB460) attendance event webhook.
// Not a normal user route — auth is via device comm key, not JWT.
router.post(
  "/device/event",
  deviceAuthMiddleware,
  validateBody(attendanceDeviceValidation.deviceEvent),
  attendanceDeviceController.receiveDeviceEvent
);
