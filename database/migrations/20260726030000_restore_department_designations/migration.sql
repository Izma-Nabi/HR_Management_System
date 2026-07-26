SET @drop_users_designation_id_fk = (
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
);

PREPARE drop_users_designation_id_fk_statement
  FROM @drop_users_designation_id_fk;
EXECUTE drop_users_designation_id_fk_statement;
DEALLOCATE PREPARE drop_users_designation_id_fk_statement;

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
    AND `REFERENCED_TABLE_NAME` = 'departments'
);

PREPARE drop_designations_departmentId_fk_statement
  FROM @drop_designations_departmentId_fk;
EXECUTE drop_designations_departmentId_fk_statement;
DEALLOCATE PREPARE drop_designations_departmentId_fk_statement;

SET @drop_global_designation_name_index = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `designations` DROP INDEX `designations_designation_name_key`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `INDEX_NAME` = 'designations_designation_name_key'
);

PREPARE drop_global_designation_name_index_statement
  FROM @drop_global_designation_name_index;
EXECUTE drop_global_designation_name_index_statement;
DEALLOCATE PREPARE drop_global_designation_name_index_statement;

SET @drop_legacy_designation_name_index = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `designations` DROP INDEX `designation_name`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `INDEX_NAME` = 'designation_name'
);

PREPARE drop_legacy_designation_name_index_statement
  FROM @drop_legacy_designation_name_index;
EXECUTE drop_legacy_designation_name_index_statement;
DEALLOCATE PREPARE drop_legacy_designation_name_index_statement;

SET @add_designations_departmentId_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `designations` ADD COLUMN `departmentId` INT UNSIGNED NULL AFTER `designation_name`',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'departmentId'
);

PREPARE add_designations_departmentId_column_statement
  FROM @add_designations_departmentId_column;
EXECUTE add_designations_departmentId_column_statement;
DEALLOCATE PREPARE add_designations_departmentId_column_statement;

ALTER TABLE `designations`
  MODIFY COLUMN `designation_name` VARCHAR(100) NOT NULL;

CREATE TEMPORARY TABLE `_designation_seed` (
  `department_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`department_name`, `designation_name`)
);

INSERT INTO `_designation_seed` (`department_name`, `designation_name`)
VALUES
  ('Human Resources', 'HR Intern'),
  ('Human Resources', 'HR Executive'),
  ('Human Resources', 'HR Manager'),
  ('Information Technology', 'IT Support Engineer'),
  ('Information Technology', 'System Administrator'),
  ('Information Technology', 'Network Engineer'),
  ('Information Technology', 'Cloud Engineer'),
  ('Information Technology', 'IT Manager'),
  ('Finance', 'Finance Executive'),
  ('Finance', 'Accountant'),
  ('Finance', 'Financial Analyst'),
  ('Finance', 'Finance Manager'),
  ('Software Development', 'Software Engineer'),
  ('Software Development', 'Frontend Developer'),
  ('Software Development', 'Backend Developer'),
  ('Software Development', 'Full Stack Developer'),
  ('Software Development', 'Mobile App Developer'),
  ('Software Development', 'UI/UX Designer'),
  ('Software Development', 'Project Manager'),
  ('Software Development', 'Software Architect'),
  ('Software Development', 'Engineering Manager'),
  ('Quality Assurance', 'QA Engineer'),
  ('Quality Assurance', 'Automation QA Engineer'),
  ('Quality Assurance', 'QA Lead'),
  ('Sales & Marketing', 'Sales Executive'),
  ('Sales & Marketing', 'Business Development Executive'),
  ('Sales & Marketing', 'Marketing Executive'),
  ('Sales & Marketing', 'Digital Marketing Specialist'),
  ('Sales & Marketing', 'SEO Specialist'),
  ('Sales & Marketing', 'Content Writer'),
  ('Sales & Marketing', 'Marketing Manager'),
  ('Customer Support', 'Customer Support Representative'),
  ('Customer Support', 'Technical Support Engineer'),
  ('Customer Support', 'Support Team Lead'),
  ('Cyber Security', 'Cyber Security Analyst'),
  ('Cyber Security', 'SOC Analyst'),
  ('Cyber Security', 'Penetration Tester'),
  ('Cyber Security', 'Information Security Engineer'),
  ('Cyber Security', 'Cyber Security Manager');

INSERT INTO `designations` (`designation_name`, `departmentId`)
SELECT `seed`.`designation_name`, `departments`.`id`
FROM `_designation_seed` AS `seed`
JOIN `departments`
  ON `departments`.`department_name` COLLATE utf8mb4_unicode_ci = `seed`.`department_name`
WHERE NOT EXISTS (
  SELECT 1
  FROM `designations` AS `existing`
  WHERE `existing`.`departmentId` = `departments`.`id`
    AND `existing`.`designation_name` COLLATE utf8mb4_unicode_ci = `seed`.`designation_name`
);

UPDATE `users` AS `u`
JOIN `roles` AS `r`
  ON `r`.`id` = `u`.`role_id`
JOIN `departments` AS `dep`
  ON `dep`.`id` = `u`.`department_id`
JOIN `designations` AS `d`
  ON `d`.`departmentId` = `dep`.`id`
 AND `d`.`designation_name` COLLATE utf8mb4_unicode_ci =
  CASE
    WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'ADMIN' THEN
      CASE `dep`.`department_name` COLLATE utf8mb4_unicode_ci
        WHEN 'Human Resources' THEN 'HR Manager'
        WHEN 'Information Technology' THEN 'IT Manager'
        WHEN 'Finance' THEN 'Finance Manager'
        WHEN 'Software Development' THEN 'Engineering Manager'
        WHEN 'Quality Assurance' THEN 'QA Lead'
        WHEN 'Sales & Marketing' THEN 'Marketing Manager'
        WHEN 'Customer Support' THEN 'Support Team Lead'
        WHEN 'Cyber Security' THEN 'Cyber Security Manager'
        ELSE NULL
      END
    WHEN UPPER(REPLACE(TRIM(`r`.`role_name`), ' ', '_')) = 'EMPLOYEE' THEN
      CASE `dep`.`department_name` COLLATE utf8mb4_unicode_ci
        WHEN 'Human Resources' THEN 'HR Intern'
        WHEN 'Information Technology' THEN 'IT Support Engineer'
        WHEN 'Finance' THEN 'Finance Executive'
        WHEN 'Software Development' THEN 'Software Engineer'
        WHEN 'Quality Assurance' THEN 'QA Engineer'
        WHEN 'Sales & Marketing' THEN 'Sales Executive'
        WHEN 'Customer Support' THEN 'Customer Support Representative'
        WHEN 'Cyber Security' THEN 'Cyber Security Analyst'
        ELSE NULL
      END
    ELSE NULL
  END
SET `u`.`designation_id` = `d`.`id`
WHERE `u`.`department_id` IS NOT NULL
  AND (
    `u`.`designation_id` IS NULL
    OR `u`.`designation_id` IN (
      SELECT `id`
      FROM (
        SELECT `id`
        FROM `designations`
        WHERE `departmentId` IS NULL
           OR UPPER(REPLACE(TRIM(`designation_name`), ' ', '_')) IN ('ADMIN', 'EMPLOYEE')
      ) AS `old_designations`
    )
  );

UPDATE `users`
SET `designation_id` = NULL
WHERE `designation_id` IN (
  SELECT `id`
  FROM (
    SELECT `id`
    FROM `designations`
    WHERE `departmentId` IS NULL
       OR UPPER(REPLACE(TRIM(`designation_name`), ' ', '_')) IN ('ADMIN', 'EMPLOYEE')
  ) AS `old_designations`
);

DELETE FROM `designations`
WHERE `departmentId` IS NULL
   OR UPPER(REPLACE(TRIM(`designation_name`), ' ', '_')) IN ('ADMIN', 'EMPLOYEE');

ALTER TABLE `designations`
  MODIFY COLUMN `departmentId` INT UNSIGNED NOT NULL;

SET @add_designations_departmentId_index = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `designations` ADD INDEX `designations_departmentId_idx` (`departmentId`)',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `INDEX_NAME` = 'designations_departmentId_idx'
);

PREPARE add_designations_departmentId_index_statement
  FROM @add_designations_departmentId_index;
EXECUTE add_designations_departmentId_index_statement;
DEALLOCATE PREPARE add_designations_departmentId_index_statement;

SET @add_designations_department_name_unique = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `designations` ADD UNIQUE KEY `designations_departmentId_designation_name_key` (`departmentId`, `designation_name`)',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`STATISTICS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `INDEX_NAME` = 'designations_departmentId_designation_name_key'
);

PREPARE add_designations_department_name_unique_statement
  FROM @add_designations_department_name_unique;
EXECUTE add_designations_department_name_unique_statement;
DEALLOCATE PREPARE add_designations_department_name_unique_statement;

SET @add_designations_departmentId_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `designations` ADD CONSTRAINT `designations_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
  FROM `INFORMATION_SCHEMA`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'designations'
    AND `COLUMN_NAME` = 'departmentId'
    AND `REFERENCED_TABLE_NAME` = 'departments'
);

PREPARE add_designations_departmentId_fk_statement
  FROM @add_designations_departmentId_fk;
EXECUTE add_designations_departmentId_fk_statement;
DEALLOCATE PREPARE add_designations_departmentId_fk_statement;

SET @add_users_designation_id_fk = (
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

PREPARE add_users_designation_id_fk_statement
  FROM @add_users_designation_id_fk;
EXECUTE add_users_designation_id_fk_statement;
DEALLOCATE PREPARE add_users_designation_id_fk_statement;

DROP TEMPORARY TABLE `_designation_seed`;
