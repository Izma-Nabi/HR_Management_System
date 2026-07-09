-- Initial Prisma migration for employee authentication.
-- This creates the same two-table design requested for the HRMS backend.

CREATE TABLE `users` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `users_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `employee_profiles` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER UNSIGNED NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `designation` VARCHAR(100) NULL,
  `biometric_id` VARCHAR(100) NULL,
  `joining_date` DATE NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `employee_profiles_user_id_key`(`user_id`),
  UNIQUE INDEX `employee_profiles_employee_code_key`(`employee_code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `employee_profiles`
  ADD CONSTRAINT `employee_profiles_user_id_fkey`
  FOREIGN KEY (`user_id`)
  REFERENCES `users`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

