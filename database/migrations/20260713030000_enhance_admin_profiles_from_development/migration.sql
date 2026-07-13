CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `department_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_department_name_key` (`department_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `admin_code` VARCHAR(20) NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NULL,
  `phone` VARCHAR(30) NULL,
  `address` VARCHAR(255) NULL,
  `department_id` INT UNSIGNED NULL,
  `designation` VARCHAR(100) NULL,
  `employment_status` VARCHAR(50) NULL DEFAULT 'Active',
  `joining_date` DATE NULL,
  `photo` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `admin_profiles_admin_code_key` (`admin_code`),

  CONSTRAINT `admin_profiles_user_id_fkey`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE,

  CONSTRAINT `admin_profiles_department_id_fkey`
    FOREIGN KEY (`department_id`)
    REFERENCES `departments`(`id`)
    ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @add_admin_code_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_profiles` ADD COLUMN `admin_code` VARCHAR(20) NULL AFTER `user_id`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_profiles'
    AND COLUMN_NAME = 'admin_code'
);
PREPARE add_admin_code_column_statement FROM @add_admin_code_column;
EXECUTE add_admin_code_column_statement;
DEALLOCATE PREPARE add_admin_code_column_statement;

UPDATE `admin_profiles`
SET `admin_code` = CONCAT('ADM', LPAD(`id`, 3, '0'))
WHERE `admin_code` IS NULL OR `admin_code` = '';

SET @add_admin_code_unique = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_profiles` ADD UNIQUE KEY `admin_profiles_admin_code_key` (`admin_code`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_profiles'
    AND INDEX_NAME = 'admin_profiles_admin_code_key'
);
PREPARE add_admin_code_unique_statement FROM @add_admin_code_unique;
EXECUTE add_admin_code_unique_statement;
DEALLOCATE PREPARE add_admin_code_unique_statement;

SET @modify_admin_code_not_null = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `admin_profiles` MODIFY `admin_code` VARCHAR(20) NOT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_profiles'
    AND COLUMN_NAME = 'admin_code'
    AND IS_NULLABLE = 'YES'
);
PREPARE modify_admin_code_not_null_statement FROM @modify_admin_code_not_null;
EXECUTE modify_admin_code_not_null_statement;
DEALLOCATE PREPARE modify_admin_code_not_null_statement;

SET @add_admin_address_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `address` VARCHAR(255) NULL AFTER `phone`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'address'
);
PREPARE add_admin_address_column_statement FROM @add_admin_address_column;
EXECUTE add_admin_address_column_statement;
DEALLOCATE PREPARE add_admin_address_column_statement;

SET @add_admin_department_id_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `department_id` INT UNSIGNED NULL AFTER `address`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'department_id'
);
PREPARE add_admin_department_id_column_statement FROM @add_admin_department_id_column;
EXECUTE add_admin_department_id_column_statement;
DEALLOCATE PREPARE add_admin_department_id_column_statement;

SET @add_admin_designation_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `designation` VARCHAR(100) NULL AFTER `department_id`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'designation'
);
PREPARE add_admin_designation_column_statement FROM @add_admin_designation_column;
EXECUTE add_admin_designation_column_statement;
DEALLOCATE PREPARE add_admin_designation_column_statement;

SET @add_admin_employment_status_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `employment_status` VARCHAR(50) NULL DEFAULT ''Active'' AFTER `designation`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'employment_status'
);
PREPARE add_admin_employment_status_column_statement FROM @add_admin_employment_status_column;
EXECUTE add_admin_employment_status_column_statement;
DEALLOCATE PREPARE add_admin_employment_status_column_statement;

SET @add_admin_joining_date_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `joining_date` DATE NULL AFTER `employment_status`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'joining_date'
);
PREPARE add_admin_joining_date_column_statement FROM @add_admin_joining_date_column;
EXECUTE add_admin_joining_date_column_statement;
DEALLOCATE PREPARE add_admin_joining_date_column_statement;

SET @add_admin_photo_column = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE `admin_profiles` ADD COLUMN `photo` VARCHAR(255) NULL AFTER `joining_date`', 'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_profiles' AND COLUMN_NAME = 'photo'
);
PREPARE add_admin_photo_column_statement FROM @add_admin_photo_column;
EXECUTE add_admin_photo_column_statement;
DEALLOCATE PREPARE add_admin_photo_column_statement;

SET @add_admin_department_index = (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `admin_profiles_department_id_idx` ON `admin_profiles` (`department_id`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_profiles'
    AND INDEX_NAME = 'admin_profiles_department_id_idx'
);
PREPARE add_admin_department_index_statement FROM @add_admin_department_index;
EXECUTE add_admin_department_index_statement;
DEALLOCATE PREPARE add_admin_department_index_statement;

SET @add_admin_department_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `admin_profiles` ADD CONSTRAINT `admin_profiles_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL',
    'SELECT 1'
  )
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'admin_profiles'
    AND CONSTRAINT_NAME = 'admin_profiles_department_id_fkey'
);
PREPARE add_admin_department_fk_statement FROM @add_admin_department_fk;
EXECUTE add_admin_department_fk_statement;
DEALLOCATE PREPARE add_admin_department_fk_statement;
