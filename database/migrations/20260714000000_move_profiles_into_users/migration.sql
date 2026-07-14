SET @add_user_code_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `userCode` VARCHAR(20) NULL AFTER `id`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'userCode'
);
PREPARE add_user_code_column_statement FROM @add_user_code_column;
EXECUTE add_user_code_column_statement;
DEALLOCATE PREPARE add_user_code_column_statement;

SET @add_user_first_name_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `firstName` VARCHAR(100) NULL AFTER `userCode`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'firstName'
);
PREPARE add_user_first_name_column_statement FROM @add_user_first_name_column;
EXECUTE add_user_first_name_column_statement;
DEALLOCATE PREPARE add_user_first_name_column_statement;

SET @add_user_last_name_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `lastName` VARCHAR(100) NULL AFTER `firstName`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'lastName'
);
PREPARE add_user_last_name_column_statement FROM @add_user_last_name_column;
EXECUTE add_user_last_name_column_statement;
DEALLOCATE PREPARE add_user_last_name_column_statement;

SET @add_user_phone_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL AFTER `password_hash`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'
);
PREPARE add_user_phone_column_statement FROM @add_user_phone_column;
EXECUTE add_user_phone_column_statement;
DEALLOCATE PREPARE add_user_phone_column_statement;

SET @add_user_address_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `address` VARCHAR(255) NULL AFTER `phone`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address'
);
PREPARE add_user_address_column_statement FROM @add_user_address_column;
EXECUTE add_user_address_column_statement;
DEALLOCATE PREPARE add_user_address_column_statement;

SET @add_user_photo_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `photo` VARCHAR(255) NULL AFTER `address`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'photo'
);
PREPARE add_user_photo_column_statement FROM @add_user_photo_column;
EXECUTE add_user_photo_column_statement;
DEALLOCATE PREPARE add_user_photo_column_statement;

SET @add_user_designation_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `designation` VARCHAR(100) NULL AFTER `photo`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'designation'
);
PREPARE add_user_designation_column_statement FROM @add_user_designation_column;
EXECUTE add_user_designation_column_statement;
DEALLOCATE PREPARE add_user_designation_column_statement;

SET @add_user_joining_date_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `joiningDate` DATE NULL AFTER `designation`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'joiningDate'
);
PREPARE add_user_joining_date_column_statement FROM @add_user_joining_date_column;
EXECUTE add_user_joining_date_column_statement;
DEALLOCATE PREPARE add_user_joining_date_column_statement;

SET @add_user_employment_status_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `employmentStatus` ENUM(''ACTIVE'', ''INACTIVE'', ''RESIGNED'', ''TERMINATED'') NOT NULL DEFAULT ''ACTIVE'' AFTER `joiningDate`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'employmentStatus'
);
PREPARE add_user_employment_status_column_statement FROM @add_user_employment_status_column;
EXECUTE add_user_employment_status_column_statement;
DEALLOCATE PREPARE add_user_employment_status_column_statement;

SET @add_user_code_unique = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD UNIQUE KEY `users_userCode_key` (`userCode`)', 'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_userCode_key'
);
PREPARE add_user_code_unique_statement FROM @add_user_code_unique;
EXECUTE add_user_code_unique_statement;
DEALLOCATE PREPARE add_user_code_unique_statement;

CREATE TABLE IF NOT EXISTS `admin_departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_departments_user_id_department_id_key` (`user_id`, `department_id`),
  KEY `admin_departments_user_id_idx` (`user_id`),
  KEY `admin_departments_department_id_idx` (`department_id`),
  CONSTRAINT `admin_departments_user_id_fkey`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `admin_departments_department_id_fkey`
    FOREIGN KEY (`department_id`)
    REFERENCES `departments`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @admin_profiles_table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles'
);

SET @employee_profiles_table_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employee_profiles'
);

SET @users_full_name_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name'
);

SET @populate_user_names_from_full_name = IF(
  @users_full_name_column_exists > 0,
  'UPDATE `users`
   SET
     `firstName` = COALESCE(`firstName`, NULLIF(TRIM(SUBSTRING_INDEX(`full_name`, '' '', 1)), '''')),
     `lastName` = COALESCE(
       `lastName`,
       NULLIF(
         TRIM(
           CASE
             WHEN LOCATE('' '', `full_name`) > 0
               THEN SUBSTRING(`full_name`, LOCATE('' '', `full_name`) + 1)
             ELSE ''''
           END
         ),
         ''''
       )
     )',
  'SELECT 1'
);
PREPARE populate_user_names_from_full_name_statement FROM @populate_user_names_from_full_name;
EXECUTE populate_user_names_from_full_name_statement;
DEALLOCATE PREPARE populate_user_names_from_full_name_statement;

SET @populate_users_from_admin_profiles = IF(
  @admin_profiles_table_exists > 0,
  'UPDATE `users` u
   JOIN `admin_profiles` ap ON ap.`user_id` = u.`id`
   SET
     u.`userCode` = COALESCE(NULLIF(u.`userCode`, ''''), NULLIF(ap.`admin_code`, '''')),
     u.`firstName` = COALESCE(NULLIF(u.`firstName`, ''''), ap.`first_name`),
     u.`lastName` = COALESCE(NULLIF(u.`lastName`, ''''), ap.`last_name`),
     u.`phone` = COALESCE(NULLIF(u.`phone`, ''''), ap.`phone`),
     u.`address` = COALESCE(NULLIF(u.`address`, ''''), ap.`address`),
     u.`photo` = COALESCE(NULLIF(u.`photo`, ''''), ap.`photo`),
     u.`designation` = COALESCE(NULLIF(u.`designation`, ''''), ap.`designation`),
     u.`joiningDate` = COALESCE(u.`joiningDate`, ap.`joining_date`),
     u.`employmentStatus` = COALESCE(NULLIF(u.`employmentStatus`, ''''), ''ACTIVE'')',
  'SELECT 1'
);
PREPARE populate_users_from_admin_profiles_statement FROM @populate_users_from_admin_profiles;
EXECUTE populate_users_from_admin_profiles_statement;
DEALLOCATE PREPARE populate_users_from_admin_profiles_statement;

SET @populate_users_from_employee_profiles = IF(
  @employee_profiles_table_exists > 0,
  'UPDATE `users` u
   JOIN `employee_profiles` ep ON ep.`user_id` = u.`id`
   SET
     u.`userCode` = COALESCE(NULLIF(u.`userCode`, ''''), NULLIF(ep.`employee_code`, '''')),
     u.`firstName` = COALESCE(NULLIF(u.`firstName`, ''''), ep.`first_name`),
     u.`lastName` = COALESCE(NULLIF(u.`lastName`, ''''), ep.`last_name`),
     u.`phone` = COALESCE(NULLIF(u.`phone`, ''''), ep.`phone`),
     u.`address` = COALESCE(NULLIF(u.`address`, ''''), ep.`address`),
     u.`photo` = COALESCE(NULLIF(u.`photo`, ''''), ep.`photo`),
     u.`designation` = COALESCE(NULLIF(u.`designation`, ''''), ep.`designation`),
     u.`joiningDate` = COALESCE(u.`joiningDate`, ep.`joining_date`),
     u.`employmentStatus` = COALESCE(NULLIF(u.`employmentStatus`, ''''), ''ACTIVE'')',
  'SELECT 1'
);
PREPARE populate_users_from_employee_profiles_statement FROM @populate_users_from_employee_profiles;
EXECUTE populate_users_from_employee_profiles_statement;
DEALLOCATE PREPARE populate_users_from_employee_profiles_statement;

SET @populate_admin_departments_from_admin_profiles = IF(
  @admin_profiles_table_exists > 0,
  'INSERT IGNORE INTO `admin_departments` (`user_id`, `department_id`)
   SELECT `user_id`, `department_id`
   FROM `admin_profiles`
   WHERE `department_id` IS NOT NULL',
  'SELECT 1'
);
PREPARE populate_admin_departments_from_admin_profiles_statement FROM @populate_admin_departments_from_admin_profiles;
EXECUTE populate_admin_departments_from_admin_profiles_statement;
DEALLOCATE PREPARE populate_admin_departments_from_admin_profiles_statement;

SET @populate_admin_departments_from_employee_profiles = IF(
  @employee_profiles_table_exists > 0,
  'INSERT IGNORE INTO `admin_departments` (`user_id`, `department_id`)
   SELECT `user_id`, `department_id`
   FROM `employee_profiles`
   WHERE `department_id` IS NOT NULL',
  'SELECT 1'
);
PREPARE populate_admin_departments_from_employee_profiles_statement FROM @populate_admin_departments_from_employee_profiles;
EXECUTE populate_admin_departments_from_employee_profiles_statement;
DEALLOCATE PREPARE populate_admin_departments_from_employee_profiles_statement;
