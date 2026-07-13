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
