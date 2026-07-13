SET @add_employee_department_id_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `employee_profiles` ADD COLUMN `department_id` INT UNSIGNED NULL AFTER `address`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND COLUMN_NAME = 'department_id'
);

PREPARE add_employee_department_id_column_statement FROM @add_employee_department_id_column;
EXECUTE add_employee_department_id_column_statement;
DEALLOCATE PREPARE add_employee_department_id_column_statement;

SET @add_employee_profile_photo_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `employee_profiles` ADD COLUMN `photo` VARCHAR(255) NULL AFTER `address`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND COLUMN_NAME = 'photo'
);

PREPARE add_employee_profile_photo_column_statement FROM @add_employee_profile_photo_column;
EXECUTE add_employee_profile_photo_column_statement;
DEALLOCATE PREPARE add_employee_profile_photo_column_statement;

SET @make_employee_department_id_nullable = (
  SELECT IF(
    IS_NULLABLE = 'NO',
    'ALTER TABLE `employee_profiles` MODIFY COLUMN `department_id` INT UNSIGNED NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND COLUMN_NAME = 'department_id'
);

PREPARE make_employee_department_id_nullable_statement FROM @make_employee_department_id_nullable;
EXECUTE make_employee_department_id_nullable_statement;
DEALLOCATE PREPARE make_employee_department_id_nullable_statement;

SET @employee_department_name_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND COLUMN_NAME = 'department'
);

SET @populate_employee_department_id = IF(
  @employee_department_name_column_exists > 0,
  'UPDATE `employee_profiles` ep
   JOIN `departments` d ON d.`department_name` = ep.`department`
   SET ep.`department_id` = d.`id`
   WHERE ep.`department_id` IS NULL',
  'SELECT 1'
);

PREPARE populate_employee_department_id_statement FROM @populate_employee_department_id;
EXECUTE populate_employee_department_id_statement;
DEALLOCATE PREPARE populate_employee_department_id_statement;

SET @add_employee_department_id_index = (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `employee_profiles_department_id_idx` ON `employee_profiles` (`department_id`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND INDEX_NAME = 'employee_profiles_department_id_idx'
);

PREPARE add_employee_department_id_index_statement FROM @add_employee_department_id_index;
EXECUTE add_employee_department_id_index_statement;
DEALLOCATE PREPARE add_employee_department_id_index_statement;

SET @add_employee_department_id_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `employee_profiles`
      ADD CONSTRAINT `employee_profiles_department_id_fkey`
      FOREIGN KEY (`department_id`)
      REFERENCES `departments`(`id`)
      ON DELETE SET NULL',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employee_profiles'
    AND CONSTRAINT_NAME = 'employee_profiles_department_id_fkey'
);

PREPARE add_employee_department_id_fk_statement FROM @add_employee_department_id_fk;
EXECUTE add_employee_department_id_fk_statement;
DEALLOCATE PREPARE add_employee_department_id_fk_statement;
