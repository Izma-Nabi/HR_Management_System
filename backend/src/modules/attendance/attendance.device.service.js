const crypto = require("crypto");
const { ApiError } = require("../../utils/apiResponse");
const mb460DeviceConfig = require("../../config/mb460.device.config");
const attendanceRepository = require("./attendance.repository");

/**
 * Device value -> AMS AttendanceEventType
 * Covers the MB460's own values (C/In, C/Out) plus the
 * generic aliases the rest of the system already accepts.
 */
const DEVICE_EVENT_MAP = new Map([
  // ZKTeco MB460 native values
  ["C/IN", "CHECK_IN"],
  ["C/OUT", "CHECK_OUT"],
  ["CHECK IN", "CHECK_IN"],
  ["CHECK OUT", "CHECK_OUT"],

  // Generic aliases (kept for manual testing / other device models)
  ["CHECKIN", "CHECK_IN"],
  ["CHECK_IN", "CHECK_IN"],
  ["IN", "CHECK_IN"],
  ["CHECKOUT", "CHECK_OUT"],
  ["CHECK_OUT", "CHECK_OUT"],
  ["OUT", "CHECK_OUT"],
  ["BREAKSTART", "BREAK_START"],
  ["BREAK_START", "BREAK_START"],
  ["BREAKEND", "BREAK_END"],
  ["BREAK_END", "BREAK_END"]
]);

/**
 * Normalizes a raw device event value (e.g. "C/In") into the
 * AMS AttendanceEventType enum value (e.g. "CHECK_IN").
 * Returns null if the value is not recognized.
 */
const normalizeDeviceEventType = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const key = String(rawValue)
    .trim()
    .toUpperCase()
    .replace(/[\s\-_/]+/g, " ") // collapse "/", "-", "_", spaces into single spaces
    .trim();

  // Try exact match first ("C IN" style after collapsing "/")
  if (DEVICE_EVENT_MAP.has(key)) {
    return DEVICE_EVENT_MAP.get(key);
  }

  // Try again with spaces removed ("CIN" / "CHECKIN" style)
  const compact = key.replace(/\s+/g, "");

  return DEVICE_EVENT_MAP.get(compact) || null;
};

/**
 * Builds the idempotency key for a device event.
 *
 * Preferred: locationId + device record id (stable, provided by device log)
 * Fallback:  hash(locationId + biometricId + eventType + eventTime)
 */
const buildSourceKey = ({
  locationId,
  biometricId,
  eventType,
  eventTime,
  deviceRecordId
}) => {
  if (deviceRecordId) {
    return `${locationId ?? "0"}:${deviceRecordId}`;
  }

  const raw = `${locationId ?? "0"}:${biometricId}:${eventType}:${eventTime}`;

  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 48);
};

/**
 * Main entry point: call this whenever the MB460 (or the middleware
 * sitting in front of it) sends an attendance event.
 *
 * @param {Object} deviceEvent
 * @param {string|number} deviceEvent.biometricId  - device user id (e.g. 10025)
 * @param {string}        deviceEvent.event        - raw device event, e.g. "C/In"
 * @param {string|Date}   deviceEvent.eventTime     - e.g. "2026-08-11 08:57:21"
 * @param {number}        [deviceEvent.locationId]  - defaults to config below if omitted
 * @param {string|number} [deviceEvent.deviceRecordId] - stable device log id, if available
 */
const processDeviceAttendanceEvent = async (deviceEvent) => {
  const {
    biometricId,
    event,
    eventTime,
    locationId,
    deviceRecordId
  } = deviceEvent;

  if (!biometricId) {
    throw new ApiError(400, "biometricId is required");
  }

  const normalizedEventType = normalizeDeviceEventType(event);

  if (!normalizedEventType) {
    throw new ApiError(
      400,
      `Unrecognized device event type: '${event}'`
    );
  }

  if (!eventTime) {
    throw new ApiError(400, "eventTime is required");
  }

  // 1. Find the user via biometric_id
  const user = await attendanceRepository.findUserByBiometricId(
    String(biometricId)
  );

  if (!user) {
    throw new ApiError(
      404,
      `No user found for biometricId '${biometricId}'`
    );
  }

  // 2. Build the attendance record
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.userCode;

  const record = {
    userId: user.id,
    userCode: user.userCode,
    biometricId: String(biometricId),
    fullName,
    locationId: locationId ?? null,
    departmentId: user.departmentId,
    designationId: user.designationId,
    eventType: normalizedEventType,
    eventTime: new Date(eventTime),
    remarks: null
  };

  // 3. Idempotency key so the same device event never inserts twice
  record.sourceKey = buildSourceKey({
    locationId: record.locationId,
    biometricId: record.biometricId,
    eventType: record.eventType,
    eventTime: record.eventTime.toISOString(),
    deviceRecordId
  });

  // 4. Save (repository silently ignores duplicates via sourceKey)
  const attendance = await attendanceRepository.createDeviceAttendance(
    record
  );

  return {
    ...attendance,
    id: Number(attendance.id),
    userId: Number(attendance.userId),
    departmentId: attendance.departmentId
      ? Number(attendance.departmentId)
      : null,
    designationId: attendance.designationId
      ? Number(attendance.designationId)
      : null,
    locationId: attendance.locationId ? Number(attendance.locationId) : null
  };
};

module.exports = {
  normalizeDeviceEventType,
  buildSourceKey,
  processDeviceAttendanceEvent,
  mb460DeviceConfig
};
