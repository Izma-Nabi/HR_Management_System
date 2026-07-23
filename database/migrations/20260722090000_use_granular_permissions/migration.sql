UPDATE `permissions`
SET `permission_name` = 'CREATE_ADMIN'
WHERE LOWER(`permission_name`) = 'create_admin';

UPDATE `permissions`
SET `permission_name` = 'UPDATE_ADMIN'
WHERE LOWER(`permission_name`) = 'edit_admin';

UPDATE `permissions`
SET `permission_name` = 'DELETE_ADMIN'
WHERE LOWER(`permission_name`) = 'delete_admin';

UPDATE `permissions`
SET `permission_name` = 'CREATE_EMPLOYEE'
WHERE LOWER(`permission_name`) = 'create_employee';

UPDATE `permissions`
SET `permission_name` = 'UPDATE_EMPLOYEE'
WHERE LOWER(`permission_name`) = 'edit_employee';

UPDATE `permissions`
SET `permission_name` = 'DELETE_EMPLOYEE'
WHERE LOWER(`permission_name`) = 'delete_employee';

UPDATE `permissions`
SET `permission_name` = 'VIEW_OWN_LEAVES'
WHERE `permission_name` = 'VIEW_OWN_LEAVE';

UPDATE `permissions`
SET `permission_name` = 'VIEW_TEAM_LEAVES'
WHERE `permission_name` = 'VIEW_TEAM_LEAVE';

INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('VIEW_ADMINS'),
  ('CREATE_ADMIN'),
  ('UPDATE_ADMIN'),
  ('DELETE_ADMIN'),
  ('VIEW_DEPARTMENTS'),
  ('CREATE_DEPARTMENT'),
  ('UPDATE_DEPARTMENT'),
  ('DELETE_DEPARTMENT'),
  ('VIEW_EMPLOYEES'),
  ('CREATE_EMPLOYEE'),
  ('UPDATE_EMPLOYEE'),
  ('DELETE_EMPLOYEE'),
  ('IMPORT_ATTENDANCE'),
  ('VIEW_SYSTEM_SUMMARY'),
  ('VIEW_TEAM_ATTENDANCE'),
  ('VIEW_OWN_ATTENDANCE'),
  ('VIEW_REPORTS'),
  ('CREATE_LEAVE'),
  ('VIEW_OWN_LEAVES'),
  ('VIEW_TEAM_LEAVES'),
  ('VIEW_ALL_LEAVES'),
  ('APPROVE_LEAVE'),
  ('REJECT_LEAVE'),
  ('CANCEL_LEAVE');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE REPLACE(UPPER(`roles`.`role_name`), ' ', '_') = 'SUPER_ADMIN'
  AND `permissions`.`permission_name` IN (
    'VIEW_ADMINS',
    'CREATE_ADMIN',
    'UPDATE_ADMIN',
    'DELETE_ADMIN',
    'VIEW_DEPARTMENTS',
    'CREATE_DEPARTMENT',
    'UPDATE_DEPARTMENT',
    'DELETE_DEPARTMENT',
    'VIEW_EMPLOYEES',
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'DELETE_EMPLOYEE',
    'IMPORT_ATTENDANCE',
    'VIEW_SYSTEM_SUMMARY',
    'VIEW_TEAM_ATTENDANCE',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_REPORTS',
    'VIEW_ALL_LEAVES',
    'VIEW_TEAM_LEAVES',
    'APPROVE_LEAVE',
    'REJECT_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE REPLACE(UPPER(`roles`.`role_name`), ' ', '_') = 'ADMIN'
  AND `permissions`.`permission_name` IN (
    'VIEW_EMPLOYEES',
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'DELETE_EMPLOYEE',
    'IMPORT_ATTENDANCE',
    'VIEW_SYSTEM_SUMMARY',
    'VIEW_REPORTS',
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVES',
    'VIEW_ALL_LEAVES',
    'VIEW_TEAM_LEAVES',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE REPLACE(UPPER(`roles`.`role_name`), ' ', '_') = 'PROJECT_MANAGER'
  AND `permissions`.`permission_name` IN (
    'VIEW_TEAM_ATTENDANCE',
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVES',
    'VIEW_TEAM_LEAVES',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE REPLACE(UPPER(`roles`.`role_name`), ' ', '_') = 'EMPLOYEE'
  AND `permissions`.`permission_name` IN (
    'VIEW_OWN_ATTENDANCE',
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVES',
    'CANCEL_LEAVE'
  );

DELETE `role_permissions`
FROM `role_permissions`
JOIN `permissions`
  ON `permissions`.`id` = `role_permissions`.`permission_id`
WHERE `permissions`.`permission_name` IN (
  'MANAGE_ADMINS',
  'MANAGE_DEPARTMENTS',
  'MANAGE_EMPLOYEES',
  'VIEW_OWN_LEAVE',
  'VIEW_TEAM_LEAVE',
  'VIEW_COMPANY_LEAVE',
  'ADD_LEAVE_NOTE',
  'VIEW_LEAVE_HISTORY'
);

DELETE FROM `permissions`
WHERE `permission_name` IN (
  'MANAGE_ADMINS',
  'MANAGE_DEPARTMENTS',
  'MANAGE_EMPLOYEES',
  'VIEW_OWN_LEAVE',
  'VIEW_TEAM_LEAVE',
  'VIEW_COMPANY_LEAVE',
  'ADD_LEAVE_NOTE',
  'VIEW_LEAVE_HISTORY'
);
