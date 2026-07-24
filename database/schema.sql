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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  UNIQUE KEY users_userCode_key (userCode),
  KEY users_role_id_idx (role_id),
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

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id INT UNSIGNED NOT NULL,
  approver_id INT UNSIGNED NULL,
  type ENUM('ANNUAL', 'SICK', 'CASUAL', 'UNPAID', 'OTHER') NOT NULL DEFAULT 'OTHER',
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NULL,
  decision_note TEXT NULL,
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY leave_requests_requester_id_idx (requester_id),
  KEY leave_requests_approver_id_idx (approver_id),
  KEY leave_requests_status_idx (status),
  KEY leave_requests_start_date_end_date_idx (start_date, end_date),
  CONSTRAINT leave_requests_requester_id_fkey
    FOREIGN KEY (requester_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT leave_requests_approver_id_fkey
    FOREIGN KEY (approver_id)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
