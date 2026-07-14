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
  userCode VARCHAR(20) NULL,
  firstName VARCHAR(100) NULL,
  lastName VARCHAR(100) NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  photo VARCHAR(255) NULL,
  designation VARCHAR(100) NULL,
  joiningDate DATE NULL,
  employmentStatus ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  role_id INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  UNIQUE KEY users_userCode_key (userCode),
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

CREATE TABLE IF NOT EXISTS admin_departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY admin_departments_user_id_department_id_key (user_id, department_id),
  KEY admin_departments_user_id_idx (user_id),
  KEY admin_departments_department_id_idx (department_id),
  CONSTRAINT admin_departments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT admin_departments_department_id_fkey
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
