CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(50) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_role_name_key` (`role_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_name` VARCHAR(100) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_permission_name_key` (`permission_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,

  PRIMARY KEY (`role_id`, `permission_id`),

  CONSTRAINT `role_permissions_role_id_fkey`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles`(`id`)
    ON DELETE CASCADE,

  CONSTRAINT `role_permissions_permission_id_fkey`
    FOREIGN KEY (`permission_id`)
    REFERENCES `permissions`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `roles` (`role_name`) VALUES
  ('SUPER ADMIN'),
  ('ADMIN'),
  ('EMPLOYEE');

SET @add_users_role_id_column = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `role_id` INT UNSIGNED NULL AFTER `password_hash`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role_id'
);
PREPARE add_users_role_id_column_statement FROM @add_users_role_id_column;
EXECUTE add_users_role_id_column_statement;
DEALLOCATE PREPARE add_users_role_id_column_statement;

SET @populate_users_role_id_from_role_enum = (
  SELECT IF(
    COUNT(*) > 0,
    'UPDATE `users` SET `role_id` = CASE `role` WHEN ''SUPER_ADMIN'' THEN (SELECT `id` FROM `roles` WHERE `role_name` = ''SUPER ADMIN'' LIMIT 1) WHEN ''ADMIN'' THEN (SELECT `id` FROM `roles` WHERE `role_name` = ''ADMIN'' LIMIT 1) ELSE (SELECT `id` FROM `roles` WHERE `role_name` = ''EMPLOYEE'' LIMIT 1) END WHERE `role_id` IS NULL',
    'UPDATE `users` SET `role_id` = (SELECT `id` FROM `roles` WHERE `role_name` = ''EMPLOYEE'' LIMIT 1) WHERE `role_id` IS NULL'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role'
);
PREPARE populate_users_role_id_from_role_enum_statement FROM @populate_users_role_id_from_role_enum;
EXECUTE populate_users_role_id_from_role_enum_statement;
DEALLOCATE PREPARE populate_users_role_id_from_role_enum_statement;

SET @modify_users_role_id_not_null = (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE `users` MODIFY `role_id` INT UNSIGNED NOT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role_id'
    AND IS_NULLABLE = 'YES'
);
PREPARE modify_users_role_id_not_null_statement FROM @modify_users_role_id_not_null;
EXECUTE modify_users_role_id_not_null_statement;
DEALLOCATE PREPARE modify_users_role_id_not_null_statement;

SET @add_users_role_id_index = (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `users_role_id_idx` ON `users` (`role_id`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_role_id_idx'
);
PREPARE add_users_role_id_index_statement FROM @add_users_role_id_index;
EXECUTE add_users_role_id_index_statement;
DEALLOCATE PREPARE add_users_role_id_index_statement;

SET @add_users_role_id_fk = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)',
    'SELECT 1'
  )
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'users_role_id_fkey'
);
PREPARE add_users_role_id_fk_statement FROM @add_users_role_id_fk;
EXECUTE add_users_role_id_fk_statement;
DEALLOCATE PREPARE add_users_role_id_fk_statement;
