INSERT IGNORE INTO `roles` (`role_name`) VALUES
  ('SUPER ADMIN'),
  ('ADMIN'),
  ('PROJECT MANAGER'),
  ('EMPLOYEE');

INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('MANAGE_ADMINS'),
  ('MANAGE_DEPARTMENTS'),
  ('MANAGE_EMPLOYEES'),
  ('VIEW_SYSTEM_SUMMARY'),
  ('VIEW_TEAM_ATTENDANCE'),
  ('VIEW_OWN_ATTENDANCE'),
  ('VIEW_REPORTS');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
  ON p.permission_name IN (
    'MANAGE_ADMINS',
    'MANAGE_DEPARTMENTS',
    'MANAGE_EMPLOYEES',
    'VIEW_SYSTEM_SUMMARY',
    'VIEW_TEAM_ATTENDANCE',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_REPORTS'
  )
WHERE r.role_name = 'SUPER ADMIN';

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
  ON p.permission_name IN (
    'MANAGE_EMPLOYEES',
    'VIEW_SYSTEM_SUMMARY',
    'VIEW_REPORTS'
  )
WHERE r.role_name = 'ADMIN';

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
  ON p.permission_name = 'VIEW_TEAM_ATTENDANCE'
WHERE r.role_name = 'PROJECT MANAGER';

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p
  ON p.permission_name = 'VIEW_OWN_ATTENDANCE'
WHERE r.role_name = 'EMPLOYEE';
