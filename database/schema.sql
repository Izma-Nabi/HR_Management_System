-- This file is a plain SQL reference for the Prisma schema.
-- Prefer Prisma migrations for the actual development workflow:
--   npm run prisma:migrate
--
-- You can still read this file to understand what tables Prisma creates.

CREATE DATABASE IF NOT EXISTS hr_management_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hr_management_system;

-- Global authentication data belongs in this table.
-- Admin accounts use SUPER_ADMIN or ADMIN.
-- Employee accounts use EMPLOYEE and connect to employees.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  KEY users_role_idx (role),
  KEY users_status_idx (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  employee_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  department VARCHAR(100) NULL,
  designation VARCHAR(100) NULL,
  fingerprint_id VARCHAR(100) NULL,
  employment_status ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  joining_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id),
  UNIQUE KEY employees_user_id_unique (user_id),
  UNIQUE KEY employees_employee_code_unique (employee_code),
  UNIQUE KEY employees_fingerprint_id_unique (fingerprint_id),
  CONSTRAINT employees_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
