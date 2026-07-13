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
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NULL,
  `phone` VARCHAR(30) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_profiles_user_id_key` (`user_id`),

  CONSTRAINT `admin_profiles_user_id_fkey`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
