const { ApiError } = require("../utils/apiResponse");
const mb460DeviceConfig = require("../config/mb460.device.config");

/**
 * The MB460 (or its middleware/agent) isn't a logged-in AMS user,
 * so it can't send a JWT. Instead it must send the shared comm key
 * configured on the device, via header:
 *
 *   x-device-key: <MB460_COMM_KEY>
 */
const deviceAuthMiddleware = (req, res, next) => {
  const providedKey = req.header("x-device-key");

  if (!mb460DeviceConfig.commKey) {
    return next(
      new ApiError(503, "Device comm key is not configured on the server")
    );
  }

  if (!providedKey || providedKey !== mb460DeviceConfig.commKey) {
    return next(new ApiError(401, "Invalid or missing device key"));
  }

  return next();
};

module.exports = deviceAuthMiddleware;
