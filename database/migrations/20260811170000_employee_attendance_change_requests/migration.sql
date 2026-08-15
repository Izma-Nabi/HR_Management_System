-- Attendance change requests are created at day level by employees. Insert
-- requests may not have an existing summary or raw attendance event, while edit
-- requests retain the raw event selected by the backend.
SET @daily_attendance_fk_name = (
  SELECT `CONSTRAINT_NAME`
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `CONSTRAINT_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance_complaints'
    AND `COLUMN_NAME` = 'daily_attendance_id'
    AND `REFERENCED_TABLE_NAME` IS NOT NULL
  LIMIT 1
);

SET @drop_daily_attendance_fk = IF(
  @daily_attendance_fk_name IS NULL,
  'SELECT 1',
  CONCAT(
    'ALTER TABLE `attendance_complaints` DROP FOREIGN KEY `',
    @daily_attendance_fk_name,
    '`'
  )
);
PREPARE drop_daily_attendance_fk_statement FROM @drop_daily_attendance_fk;
EXECUTE drop_daily_attendance_fk_statement;
DEALLOCATE PREPARE drop_daily_attendance_fk_statement;

ALTER TABLE `attendance_complaints`
  DROP FOREIGN KEY `attendance_complaints_raw_attendance_id_fkey`;

ALTER TABLE `attendance_complaints`
  MODIFY `daily_attendance_id` INTEGER UNSIGNED NULL,
  ADD COLUMN `requested_attendance_date` DATE NULL AFTER `attendance_date`,
  ADD COLUMN `request_action` ENUM('INSERT', 'EDIT') NOT NULL DEFAULT 'EDIT' AFTER `requested_attendance_date`,
  ADD COLUMN `requested_event_time` VARCHAR(5) NULL AFTER `request_action`;

-- The migration history contains the original check_in/check_out attendance
-- shape, while deployed databases use event_type/event_time. Match the raw FK
-- column type and backfill from whichever attendance shape is present.
SET @attendance_id_type = (
  SELECT `COLUMN_TYPE`
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `COLUMN_NAME` = 'id'
  LIMIT 1
);

SET @make_raw_attendance_nullable = CONCAT(
  'ALTER TABLE `attendance_complaints` MODIFY `raw_attendance_id` ',
  @attendance_id_type,
  ' NULL'
);

PREPARE make_raw_attendance_nullable_statement
  FROM @make_raw_attendance_nullable;
EXECUTE make_raw_attendance_nullable_statement;
DEALLOCATE PREPARE make_raw_attendance_nullable_statement;

SET @has_event_attendance_columns = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `COLUMN_NAME` = 'event_time'
);

SET @backfill_attendance_requests = IF(
  @has_event_attendance_columns > 0,
  'UPDATE `attendance_complaints` AS complaint LEFT JOIN `attendance` AS attendance ON attendance.id = complaint.raw_attendance_id SET complaint.requested_attendance_date = complaint.attendance_date, complaint.requested_event_time = COALESCE(TIME_FORMAT(attendance.event_time, ''%H:%i''), ''00:00''), complaint.complaint_type = CASE WHEN attendance.event_type IN (''CHECK_IN'', ''CHECK_OUT'') THEN attendance.event_type WHEN complaint.complaint_type = ''CHECK_OUT'' THEN ''CHECK_OUT'' ELSE ''CHECK_IN'' END',
  'UPDATE `attendance_complaints` AS complaint LEFT JOIN `attendance` AS attendance ON attendance.id = complaint.raw_attendance_id SET complaint.requested_attendance_date = complaint.attendance_date, complaint.requested_event_time = COALESCE(TIME_FORMAT(CASE WHEN complaint.complaint_type = ''CHECK_OUT'' THEN attendance.check_out ELSE attendance.check_in END, ''%H:%i''), ''00:00''), complaint.complaint_type = CASE WHEN complaint.complaint_type = ''CHECK_OUT'' THEN ''CHECK_OUT'' ELSE ''CHECK_IN'' END'
);

PREPARE backfill_attendance_requests_statement
  FROM @backfill_attendance_requests;
EXECUTE backfill_attendance_requests_statement;
DEALLOCATE PREPARE backfill_attendance_requests_statement;

ALTER TABLE `attendance_complaints`
  MODIFY `requested_attendance_date` DATE NOT NULL,
  MODIFY `requested_event_time` VARCHAR(5) NOT NULL,
  ADD CONSTRAINT `attendance_complaints_raw_attendance_id_fkey`
    FOREIGN KEY (`raw_attendance_id`) REFERENCES `attendance`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

SET @has_attendance_summary_table = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`TABLES`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance_summary'
);

SET @add_daily_attendance_fk = IF(
  @has_attendance_summary_table > 0,
  'ALTER TABLE `attendance_complaints` ADD CONSTRAINT `attendance_complaints_daily_attendance_id_fkey` FOREIGN KEY (`daily_attendance_id`) REFERENCES `attendance_summary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE add_daily_attendance_fk_statement FROM @add_daily_attendance_fk;
EXECUTE add_daily_attendance_fk_statement;
DEALLOCATE PREPARE add_daily_attendance_fk_statement;
