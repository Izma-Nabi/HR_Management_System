-- Add the designation_id column only when it is missing.
-- This form works on MySQL versions that do not support
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
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
