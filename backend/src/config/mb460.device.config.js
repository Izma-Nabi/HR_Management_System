/**
 * ZKTeco MB460 Device Configuration
 *
 * Only the fields currently required. More fields (e.g. deviceId,
 * model, firmware version) can be added here later — nothing else
 * in the codebase needs to change when you do.
 *
 * Values are read from environment variables so the real device
 * credentials never live in source control. Put the actual values
 * in your .env file:
 *
 *   MB460_IP_ADDRESS=192.168.1.201
 *   MB460_SUBNET_MASK=255.255.255.0
 *   MB460_GATEWAY=192.168.1.1
 *   MB460_TCP_COMM_PORT=4370
 *   MB460_COMM_KEY=123456
 */

const mb460DeviceConfig = {
  ipAddress: process.env.MB460_IP_ADDRESS || "",
  subnetMask: process.env.MB460_SUBNET_MASK || "",
  gateway: process.env.MB460_GATEWAY || "",
  tcpCommPort: Number(process.env.MB460_TCP_COMM_PORT) || 4370,
  commKey: process.env.MB460_COMM_KEY || "",
};

module.exports = mb460DeviceConfig;
