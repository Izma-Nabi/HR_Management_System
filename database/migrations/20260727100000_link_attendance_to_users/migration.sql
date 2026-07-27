SET @add_attendance_user_id_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `attendance` ADD COLUMN `user_id` INT UNSIGNED NULL AFTER `id`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `COLUMN_NAME` = 'user_id'
);

PREPARE add_attendance_user_id_column_statement
  FROM @add_attendance_user_id_column;
EXECUTE add_attendance_user_id_column_statement;
DEALLOCATE PREPARE add_attendance_user_id_column_statement;

UPDATE `attendance` AS `attendance`
JOIN `users` AS `users`
  ON `users`.`userCode` = `attendance`.`user_code`
SET `attendance`.`user_id` = `users`.`id`
WHERE `attendance`.`user_id` IS NULL;

SET @add_attendance_user_date_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `attendance` ADD INDEX `attendance_user_id_attendance_date_idx` (`user_id`, `attendance_date`)',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `INDEX_NAME` = 'attendance_user_id_attendance_date_idx'
);

PREPARE add_attendance_user_date_index_statement
  FROM @add_attendance_user_date_index;
EXECUTE add_attendance_user_date_index_statement;
DEALLOCATE PREPARE add_attendance_user_date_index_statement;

SET @add_attendance_user_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `attendance` ADD CONSTRAINT `attendance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'attendance'
    AND `CONSTRAINT_NAME` = 'attendance_user_id_fkey'
);

PREPARE add_attendance_user_fk_statement
  FROM @add_attendance_user_fk;
EXECUTE add_attendance_user_fk_statement;
DEALLOCATE PREPARE add_attendance_user_fk_statement;
