-- Plain SQL reference for the current Prisma schema.
-- Prefer Prisma migrations for actual database updates:
--   npm run prisma:migrate

CREATE DATABASE IF NOT EXISTS hr_management_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hr_management_system;

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY roles_role_name_key (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY permissions_permission_name_key (permission_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_id_fkey
    FOREIGN KEY (permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  KEY users_role_id_idx (role_id),
  KEY users_status_idx (status),
  CONSTRAINT users_role_id_fkey
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY departments_department_name_key (department_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_profiles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  admin_code VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  department_id INT UNSIGNED NULL,
  designation VARCHAR(100) NULL,
  employment_status VARCHAR(50) NULL DEFAULT 'Active',
  joining_date DATE NULL,
  photo VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY admin_profiles_user_id_key (user_id),
  UNIQUE KEY admin_profiles_admin_code_key (admin_code),
  KEY admin_profiles_department_id_idx (department_id),
  CONSTRAINT admin_profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT admin_profiles_department_id_fkey
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_profiles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  photo VARCHAR(255) NULL,
  department_id INT UNSIGNED NULL,
  designation VARCHAR(100) NULL,
  joining_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY employee_profiles_user_id_unique (user_id),
  UNIQUE KEY employee_profiles_employee_code_unique (employee_code),
  KEY employee_profiles_department_id_idx (department_id),
  CONSTRAINT employee_profiles_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT employee_profiles_department_id_fkey
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
