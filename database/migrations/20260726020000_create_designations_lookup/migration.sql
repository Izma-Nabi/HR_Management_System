CREATE TABLE IF NOT EXISTS `designations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `designation_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `designations_designation_name_key` (`designation_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @drop_designations_departmentId_fk = (
  SELECT IF(
    COUNT(*) > 0,
    CONCAT('ALTER TABLE `designations` DROP FOREIGN KEY `', MAX(`CONSTRAINT_NAME`), '`'),
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'departmentId'
    AND `REFERENCED_TABLE_NAME` IS NOT NULL
);

PREPARE drop_designations_departmentId_fk_statement
  FROM @drop_designations_departmentId_fk;
EXECUTE drop_designations_departmentId_fk_statement;
DEALLOCATE PREPARE drop_designations_departmentId_fk_statement;

SET @drop_designations_department_id_fk = (
  SELECT IF(
    COUNT(*) > 0,
    CONCAT('ALTER TABLE `designations` DROP FOREIGN KEY `', MAX(`CONSTRAINT_NAME`), '`'),
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'department_id'
    AND `REFERENCED_TABLE_NAME` IS NOT NULL
);

PREPARE drop_designations_department_id_fk_statement
  FROM @drop_designations_department_id_fk;
EXECUTE drop_designations_department_id_fk_statement;
DEALLOCATE PREPARE drop_designations_department_id_fk_statement;

SET @drop_designations_departmentId_column = (
  SELECT IF(
    COUNT(*) = 1,
    'ALTER TABLE `designations` DROP COLUMN `departmentId`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'departmentId'
);

PREPARE drop_designations_departmentId_column_statement
  FROM @drop_designations_departmentId_column;
EXECUTE drop_designations_departmentId_column_statement;
DEALLOCATE PREPARE drop_designations_departmentId_column_statement;

SET @drop_designations_department_id_column = (
  SELECT IF(
    COUNT(*) = 1,
    'ALTER TABLE `designations` DROP COLUMN `department_id`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'department_id'
);

PREPARE drop_designations_department_id_column_statement
  FROM @drop_designations_department_id_column;
EXECUTE drop_designations_department_id_column_statement;
DEALLOCATE PREPARE drop_designations_department_id_column_statement;

SET @drop_designations_description_column = (
  SELECT IF(
    COUNT(*) = 1,
    'ALTER TABLE `designations` DROP COLUMN `description`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'description'
);

PREPARE drop_designations_description_column_statement
  FROM @drop_designations_description_column;
EXECUTE drop_designations_description_column_statement;
DEALLOCATE PREPARE drop_designations_description_column_statement;

INSERT INTO `designations` (`designation_name`)
VALUES ('Admin'), ('Employee')
ON DUPLICATE KEY UPDATE
  `designation_name` = VALUES(`designation_name`);

SET @add_user_designation_id_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `designation_id` INT UNSIGNED NULL AFTER `photo`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation_id'
);

PREPARE add_user_designation_id_column_statement
  FROM @add_user_designation_id_column;
EXECUTE add_user_designation_id_column_statement;
DEALLOCATE PREPARE add_user_designation_id_column_statement;

SET @sync_legacy_designation = (
  SELECT IF(
    COUNT(*) = 1,
    'UPDATE `users` AS `u`
       JOIN `designations` AS `d`
         ON UPPER(REPLACE(TRIM(`u`.`designation`), '' '', ''_'')) = UPPER(REPLACE(TRIM(`d`.`designation_name`), '' '', ''_''))
      SET `u`.`designation_id` = `d`.`id`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation'
);

PREPARE sync_legacy_designation_statement
  FROM @sync_legacy_designation;
EXECUTE sync_legacy_designation_statement;
DEALLOCATE PREPARE sync_legacy_designation_statement;

UPDATE `users` AS `u`
JOIN `roles` AS `r`
  ON `r`.`id` = `u`.`role_id`
JOIN `designations` AS `d`
  ON UPPER(REPLACE(TRIM(`d`.`designation_name`), ' ', '_')) =
    CASE
      WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'ADMIN' THEN 'ADMIN'
      WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'EMPLOYEE' THEN 'EMPLOYEE'
      ELSE NULL
    END
SET `u`.`designation_id` = `d`.`id`
WHERE `u`.`designation_id` IS NULL;

UPDATE `users` AS `u`
JOIN `roles` AS `r`
  ON `r`.`id` = `u`.`role_id`
JOIN `designations` AS `d`
  ON UPPER(REPLACE(TRIM(`d`.`designation_name`), ' ', '_')) =
    CASE
      WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'ADMIN' THEN 'ADMIN'
      WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'EMPLOYEE' THEN 'EMPLOYEE'
      ELSE NULL
    END
SET `u`.`designation_id` = `d`.`id`
WHERE `u`.`designation_id` IS NOT NULL
  AND `u`.`designation_id` IN (
    SELECT `id`
    FROM `designations`
    WHERE UPPER(REPLACE(TRIM(`designation_name`), ' ', '_')) NOT IN ('ADMIN', 'EMPLOYEE')
  );

UPDATE `users`
SET `designation_id` = NULL
WHERE `designation_id` IS NOT NULL
  AND `designation_id` NOT IN (
    SELECT `id`
    FROM `designations`
  );

DELETE FROM `designations`
WHERE UPPER(REPLACE(TRIM(`designation_name`), ' ', '_')) NOT IN ('ADMIN', 'EMPLOYEE');

ALTER TABLE `designations`
  MODIFY COLUMN `designation_name` VARCHAR(50) NOT NULL;

SET @rename_designations_designation_name_index = (
  SELECT IF(
    SUM(`INDEX_NAME` = 'designation_name') > 0
      AND SUM(`INDEX_NAME` = 'designations_designation_name_key') = 0,
    'ALTER TABLE `designations` DROP INDEX `designation_name`, ADD UNIQUE KEY `designations_designation_name_key` (`designation_name`)',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
);

PREPARE rename_designations_designation_name_index_statement
  FROM @rename_designations_designation_name_index;
EXECUTE rename_designations_designation_name_index_statement;
DEALLOCATE PREPARE rename_designations_designation_name_index_statement;

SET @add_user_designation_id_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD INDEX `users_designation_id_idx` (`designation_id`)',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `INDEX_NAME` = 'users_designation_id_idx'
);

PREPARE add_user_designation_id_index_statement
  FROM @add_user_designation_id_index;
EXECUTE add_user_designation_id_index_statement;
DEALLOCATE PREPARE add_user_designation_id_index_statement;

SET @drop_noncanonical_user_designation_id_fk = (
  SELECT IF(
    COUNT(*) > 0,
    CONCAT('ALTER TABLE `users` DROP FOREIGN KEY `', MAX(`CONSTRAINT_NAME`), '`'),
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation_id'
    AND `REFERENCED_TABLE_NAME` = 'designations'
    AND `CONSTRAINT_NAME` <> 'users_designation_id_fkey'
);

PREPARE drop_noncanonical_user_designation_id_fk_statement
  FROM @drop_noncanonical_user_designation_id_fk;
EXECUTE drop_noncanonical_user_designation_id_fk_statement;
DEALLOCATE PREPARE drop_noncanonical_user_designation_id_fk_statement;

SET @add_user_designation_id_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD CONSTRAINT `users_designation_id_fkey` FOREIGN KEY (`designation_id`) REFERENCES `designations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation_id'
    AND `REFERENCED_TABLE_NAME` = 'designations'
);

PREPARE add_user_designation_id_fk_statement
  FROM @add_user_designation_id_fk;
EXECUTE add_user_designation_id_fk_statement;
DEALLOCATE PREPARE add_user_designation_id_fk_statement;

SET @drop_legacy_designation_column = (
  SELECT IF(
    COUNT(*) = 1,
    'ALTER TABLE `users` DROP COLUMN `designation`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'users'
    AND `COLUMN_NAME` = 'designation'
);

PREPARE drop_legacy_designation_column_statement
  FROM @drop_legacy_designation_column;
EXECUTE drop_legacy_designation_column_statement;
DEALLOCATE PREPARE drop_legacy_designation_column_statement;
