DROP TRIGGER IF EXISTS `attendance_set_pakistan_timestamps_before_insert`;
DROP TRIGGER IF EXISTS `attendance_set_pakistan_updated_at_before_update`;

CREATE TRIGGER `attendance_set_pakistan_timestamps_before_insert`
BEFORE INSERT ON `attendance`
FOR EACH ROW
SET
  NEW.`created_at` = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR),
  NEW.`updated_at` = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR);

CREATE TRIGGER `attendance_set_pakistan_updated_at_before_update`
BEFORE UPDATE ON `attendance`
FOR EACH ROW
SET NEW.`updated_at` = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR);
