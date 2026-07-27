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

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY departments_department_name_key (department_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS designations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  designation_name VARCHAR(100) NOT NULL,
  departmentId INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY designations_departmentId_designation_name_key (departmentId, designation_name),
  KEY designations_departmentId_idx (departmentId),
  CONSTRAINT designations_departmentId_fkey
    FOREIGN KEY (departmentId)
    REFERENCES departments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO designations (designation_name, departmentId)
SELECT seed.designation_name, departments.id
FROM (
  SELECT 'Human Resources' AS department_name, 'HR Intern' AS designation_name UNION ALL
  SELECT 'Human Resources', 'HR Executive' UNION ALL
  SELECT 'Human Resources', 'HR Manager' UNION ALL
  SELECT 'Information Technology', 'IT Support Engineer' UNION ALL
  SELECT 'Information Technology', 'System Administrator' UNION ALL
  SELECT 'Information Technology', 'Network Engineer' UNION ALL
  SELECT 'Information Technology', 'Cloud Engineer' UNION ALL
  SELECT 'Information Technology', 'IT Manager' UNION ALL
  SELECT 'Finance', 'Finance Executive' UNION ALL
  SELECT 'Finance', 'Accountant' UNION ALL
  SELECT 'Finance', 'Financial Analyst' UNION ALL
  SELECT 'Finance', 'Finance Manager' UNION ALL
  SELECT 'Software Development', 'Software Engineer' UNION ALL
  SELECT 'Software Development', 'Frontend Developer' UNION ALL
  SELECT 'Software Development', 'Backend Developer' UNION ALL
  SELECT 'Software Development', 'Full Stack Developer' UNION ALL
  SELECT 'Software Development', 'Mobile App Developer' UNION ALL
  SELECT 'Software Development', 'UI/UX Designer' UNION ALL
  SELECT 'Software Development', 'Project Manager' UNION ALL
  SELECT 'Software Development', 'Software Architect' UNION ALL
  SELECT 'Software Development', 'Engineering Manager' UNION ALL
  SELECT 'Quality Assurance', 'QA Engineer' UNION ALL
  SELECT 'Quality Assurance', 'Automation QA Engineer' UNION ALL
  SELECT 'Quality Assurance', 'QA Lead' UNION ALL
  SELECT 'Sales & Marketing', 'Sales Executive' UNION ALL
  SELECT 'Sales & Marketing', 'Business Development Executive' UNION ALL
  SELECT 'Sales & Marketing', 'Marketing Executive' UNION ALL
  SELECT 'Sales & Marketing', 'Digital Marketing Specialist' UNION ALL
  SELECT 'Sales & Marketing', 'SEO Specialist' UNION ALL
  SELECT 'Sales & Marketing', 'Content Writer' UNION ALL
  SELECT 'Sales & Marketing', 'Marketing Manager' UNION ALL
  SELECT 'Customer Support', 'Customer Support Representative' UNION ALL
  SELECT 'Customer Support', 'Technical Support Engineer' UNION ALL
  SELECT 'Customer Support', 'Support Team Lead' UNION ALL
  SELECT 'Cyber Security', 'Cyber Security Analyst' UNION ALL
  SELECT 'Cyber Security', 'SOC Analyst' UNION ALL
  SELECT 'Cyber Security', 'Penetration Tester' UNION ALL
  SELECT 'Cyber Security', 'Information Security Engineer' UNION ALL
  SELECT 'Cyber Security', 'Cyber Security Manager'
) AS seed
JOIN departments
  ON departments.department_name = seed.department_name
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userCode VARCHAR(20) NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  photo VARCHAR(255) NULL,
  designation_id INT UNSIGNED NULL,
  joiningDate DATE NULL,
  employmentStatus ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NULL DEFAULT 'ACTIVE',
  role_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email),
  UNIQUE KEY users_userCode_key (userCode),
  KEY users_role_id_idx (role_id),
  KEY users_department_id_idx (department_id),
  KEY users_designation_id_idx (designation_id),
  CONSTRAINT users_role_id_fkey
    FOREIGN KEY (role_id)
    REFERENCES roles(id),
  CONSTRAINT users_department_id_fkey
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL,
  CONSTRAINT users_designation_id_fkey
    FOREIGN KEY (designation_id)
    REFERENCES designations(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  user_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  attendance_date DATE NOT NULL,
  check_in TIME NULL,
  check_out TIME NULL,
  status ENUM('Present', 'Absent', 'Late', 'Leave') NOT NULL,
  remarks TEXT NULL,
  source_key VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY attendance_source_key_key (source_key),
  KEY attendance_user_id_attendance_date_idx (user_id, attendance_date),
  CONSTRAINT attendance_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('ANNUAL', 'CASUAL', 'SICK', 'UNPAID', 'OTHER') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  current_approval_level INT NOT NULL DEFAULT 1,
  current_refers_to INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY leave_requests_user_id_idx (user_id),
  KEY leave_requests_current_refers_to_idx (current_refers_to),
  KEY leave_requests_status_idx (status),
  CONSTRAINT leave_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT leave_requests_current_refers_to_fkey
    FOREIGN KEY (current_refers_to)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_approvals (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  leave_request_id INT UNSIGNED NOT NULL,
  refers_to INT UNSIGNED NOT NULL,
  approval_level INT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  decision_note TEXT NULL,
  decided_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY leave_approvals_leave_request_id_idx (leave_request_id),
  KEY leave_approvals_refers_to_idx (refers_to),
  KEY leave_approvals_status_idx (status),
  CONSTRAINT leave_approvals_leave_request_id_fkey
    FOREIGN KEY (leave_request_id)
    REFERENCES leave_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT leave_approvals_refers_to_fkey
    FOREIGN KEY (refers_to)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_approval_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  leave_request_id INT UNSIGNED NOT NULL,
  refers_to INT UNSIGNED NOT NULL,
  approval_level INT NOT NULL,
  action ENUM('APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY leave_approval_history_leave_request_id_idx (leave_request_id),
  KEY leave_approval_history_refers_to_idx (refers_to),
  CONSTRAINT leave_approval_history_leave_request_id_fkey
    FOREIGN KEY (leave_request_id)
    REFERENCES leave_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT leave_approval_history_refers_to_fkey
    FOREIGN KEY (refers_to)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
