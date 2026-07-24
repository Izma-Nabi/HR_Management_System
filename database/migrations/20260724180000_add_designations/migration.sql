CREATE TABLE IF NOT EXISTS `designations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `designation_name` VARCHAR(100) NOT NULL,
  `department_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `designations_department_id_designation_name_key` (`department_id`, `designation_name`),
  KEY `designations_department_id_idx` (`department_id`),
  CONSTRAINT `designations_department_id_fkey`
    FOREIGN KEY (`department_id`)
    REFERENCES `departments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @users_designation_index_exists = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation_id'
);

SET @add_users_designation_index = IF(
  @users_designation_index_exists = 0,
  'ALTER TABLE `users` ADD INDEX `users_designation_id_idx` (`designation_id`)',
  'SELECT 1'
);

PREPARE add_users_designation_index_statement
  FROM @add_users_designation_index;
EXECUTE add_users_designation_index_statement;
DEALLOCATE PREPARE add_users_designation_index_statement;

SET @users_designation_fk_exists = (
  SELECT COUNT(*)
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation_id'
    AND `REFERENCED_TABLE_NAME` = 'designations'
    AND `REFERENCED_COLUMN_NAME` = 'id'
);

SET @add_users_designation_fk = IF(
  @users_designation_fk_exists = 0,
  'ALTER TABLE `users` ADD CONSTRAINT `users_designation_id_fkey` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE add_users_designation_fk_statement
  FROM @add_users_designation_fk;
EXECUTE add_users_designation_fk_statement;
DEALLOCATE PREPARE add_users_designation_fk_statement;
