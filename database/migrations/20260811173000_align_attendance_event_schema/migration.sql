-- The live attendance source stores one event per row. Older migration
-- histories still create the former daily check_in/check_out table, so convert
-- that shape once while leaving already-converted databases unchanged.

SET @has_user_biometric_id = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'biometric_id'
);

SET @add_user_biometric_id = IF(
  @has_user_biometric_id = 0,
  'ALTER TABLE `users` ADD COLUMN `biometric_id` VARCHAR(50) NULL AFTER `userCode`',
  'SELECT 1'
);
PREPARE add_user_biometric_id_statement FROM @add_user_biometric_id;
EXECUTE add_user_biometric_id_statement;
DEALLOCATE PREPARE add_user_biometric_id_statement;

SET @has_user_biometric_index = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `INDEX_NAME` = 'biometric_id'
);

SET @add_user_biometric_index = IF(
  @has_user_biometric_index = 0,
  'ALTER TABLE `users` ADD UNIQUE INDEX `biometric_id` (`biometric_id`)',
  'SELECT 1'
);
PREPARE add_user_biometric_index_statement FROM @add_user_biometric_index;
EXECUTE add_user_biometric_index_statement;
DEALLOCATE PREPARE add_user_biometric_index_statement;

SET @attendance_needs_event_migration = (
  SELECT COUNT(*) = 0
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `COLUMN_NAME` = 'event_time'
);

SET @drop_raw_attendance_fk = IF(
  @attendance_needs_event_migration,
  'ALTER TABLE `attendance_complaints` DROP FOREIGN KEY `attendance_complaints_raw_attendance_id_fkey`',
  'SELECT 1'
);
PREPARE drop_raw_attendance_fk_statement FROM @drop_raw_attendance_fk;
EXECUTE drop_raw_attendance_fk_statement;
DEALLOCATE PREPARE drop_raw_attendance_fk_statement;

SET @rename_legacy_attendance = IF(
  @attendance_needs_event_migration,
  'RENAME TABLE `attendance` TO `attendance_old`',
  'SELECT 1'
);
PREPARE rename_legacy_attendance_statement FROM @rename_legacy_attendance;
EXECUTE rename_legacy_attendance_statement;
DEALLOCATE PREPARE rename_legacy_attendance_statement;

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER UNSIGNED NOT NULL,
  `user_code` VARCHAR(50) NOT NULL,
  `biometric_id` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `location_id` INTEGER UNSIGNED NULL,
  `department_id` INTEGER UNSIGNED NULL,
  `designation_id` INTEGER UNSIGNED NULL,
  `event_type` ENUM('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END') NOT NULL,
  `event_time` DATETIME(0) NOT NULL,
  `remarks` TEXT NULL,
  `source_key` VARCHAR(128) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX `source_key` (`source_key`),
  INDEX `idx_attendance_biometric_id` (`biometric_id`),
  INDEX `idx_attendance_event_time` (`event_time`),
  INDEX `idx_attendance_event_type` (`event_type`),
  INDEX `idx_attendance_location_id` (`location_id`),
  INDEX `idx_department_id` (`department_id`),
  INDEX `idx_designation_id` (`designation_id`),
  INDEX `idx_user_date` (`user_id`),
  INDEX `idx_user_date_event` (`user_id`, `event_type`),
  INDEX `idx_user_id` (`user_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_attendance_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_attendance_department`
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT `fk_attendance_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`)
    ON DELETE RESTRICT ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @copy_legacy_check_ins = IF(
  @attendance_needs_event_migration,
  'INSERT INTO `attendance` (`user_id`, `user_code`, `biometric_id`, `full_name`, `location_id`, `department_id`, `designation_id`, `event_type`, `event_time`, `remarks`, `source_key`, `created_at`, `updated_at`) SELECT old_attendance.user_id, old_attendance.user_code, COALESCE(users.biometric_id, old_attendance.user_code), old_attendance.full_name, NULL, users.department_id, users.designation_id, ''CHECK_IN'', TIMESTAMP(old_attendance.attendance_date, old_attendance.check_in), old_attendance.remarks, CONCAT(''LEGACY_'', old_attendance.id, ''_CHECK_IN''), old_attendance.created_at, old_attendance.updated_at FROM `attendance_old` AS old_attendance JOIN `users` AS users ON users.id = old_attendance.user_id WHERE old_attendance.check_in IS NOT NULL',
  'SELECT 1'
);
PREPARE copy_legacy_check_ins_statement FROM @copy_legacy_check_ins;
EXECUTE copy_legacy_check_ins_statement;
DEALLOCATE PREPARE copy_legacy_check_ins_statement;

SET @copy_legacy_check_outs = IF(
  @attendance_needs_event_migration,
  'INSERT INTO `attendance` (`user_id`, `user_code`, `biometric_id`, `full_name`, `location_id`, `department_id`, `designation_id`, `event_type`, `event_time`, `remarks`, `source_key`, `created_at`, `updated_at`) SELECT old_attendance.user_id, old_attendance.user_code, COALESCE(users.biometric_id, old_attendance.user_code), old_attendance.full_name, NULL, users.department_id, users.designation_id, ''CHECK_OUT'', TIMESTAMP(old_attendance.attendance_date, old_attendance.check_out), old_attendance.remarks, CONCAT(''LEGACY_'', old_attendance.id, ''_CHECK_OUT''), old_attendance.created_at, old_attendance.updated_at FROM `attendance_old` AS old_attendance JOIN `users` AS users ON users.id = old_attendance.user_id WHERE old_attendance.check_out IS NOT NULL',
  'SELECT 1'
);
PREPARE copy_legacy_check_outs_statement FROM @copy_legacy_check_outs;
EXECUTE copy_legacy_check_outs_statement;
DEALLOCATE PREPARE copy_legacy_check_outs_statement;

SET @remap_attendance_complaints = IF(
  @attendance_needs_event_migration,
  'UPDATE `attendance_complaints` AS complaint JOIN `attendance_old` AS old_attendance ON old_attendance.id = complaint.raw_attendance_id LEFT JOIN `attendance` AS check_in_event ON check_in_event.source_key = CONCAT(''LEGACY_'', old_attendance.id, ''_CHECK_IN'') LEFT JOIN `attendance` AS check_out_event ON check_out_event.source_key = CONCAT(''LEGACY_'', old_attendance.id, ''_CHECK_OUT'') SET complaint.raw_attendance_id = CASE WHEN complaint.complaint_type = ''CHECK_OUT'' THEN COALESCE(check_out_event.id, check_in_event.id) ELSE COALESCE(check_in_event.id, check_out_event.id) END',
  'SELECT 1'
);
PREPARE remap_attendance_complaints_statement FROM @remap_attendance_complaints;
EXECUTE remap_attendance_complaints_statement;
DEALLOCATE PREPARE remap_attendance_complaints_statement;

SET @align_raw_attendance_id_type = IF(
  @attendance_needs_event_migration,
  'ALTER TABLE `attendance_complaints` MODIFY `raw_attendance_id` INTEGER UNSIGNED NULL',
  'SELECT 1'
);
PREPARE align_raw_attendance_id_type_statement FROM @align_raw_attendance_id_type;
EXECUTE align_raw_attendance_id_type_statement;
DEALLOCATE PREPARE align_raw_attendance_id_type_statement;

SET @add_raw_attendance_fk = IF(
  @attendance_needs_event_migration,
  'ALTER TABLE `attendance_complaints` ADD CONSTRAINT `attendance_complaints_raw_attendance_id_fkey` FOREIGN KEY (`raw_attendance_id`) REFERENCES `attendance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE add_raw_attendance_fk_statement FROM @add_raw_attendance_fk;
EXECUTE add_raw_attendance_fk_statement;
DEALLOCATE PREPARE add_raw_attendance_fk_statement;
