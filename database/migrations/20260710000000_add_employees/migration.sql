DROP TABLE IF EXISTS `employee_profiles`;

SET @drop_employee_profile_fk = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `Admin_Profile` DROP FOREIGN KEY `Admin_Profile_ibfk_1`',
    'SELECT 1'
  )
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Admin_Profile'
    AND CONSTRAINT_NAME = 'Admin_Profile_ibfk_1'
    AND REFERENCED_TABLE_NAME = 'Employee_Profile'
);

PREPARE drop_employee_profile_fk_statement FROM @drop_employee_profile_fk;
EXECUTE drop_employee_profile_fk_statement;
DEALLOCATE PREPARE drop_employee_profile_fk_statement;

DROP TABLE IF EXISTS `Employee_Profile`;

CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `department` VARCHAR(100) NULL,
  `designation` VARCHAR(100) NULL,
  `fingerprint_id` VARCHAR(100) NULL,
  `employment_status` ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `joining_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employees_user_id_unique` (`user_id`),
  UNIQUE KEY `employees_employee_code_unique` (`employee_code`),
  UNIQUE KEY `employees_fingerprint_id_unique` (`fingerprint_id`),

  CONSTRAINT `employees_user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
