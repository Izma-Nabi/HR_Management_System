INSERT INTO `roles` (`role_name`)
SELECT 'Super Admin'
WHERE NOT EXISTS (
  SELECT 1
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'SUPER_ADMIN'
);

INSERT INTO `roles` (`role_name`)
SELECT 'Admin'
WHERE NOT EXISTS (
  SELECT 1
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'ADMIN'
);

INSERT INTO `roles` (`role_name`)
SELECT 'Employee'
WHERE NOT EXISTS (
  SELECT 1
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'EMPLOYEE'
);

SET @super_admin_role_id = (
  SELECT `id`
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'SUPER_ADMIN'
  ORDER BY `role_name` = 'Super Admin' DESC, `id` ASC
  LIMIT 1
);

SET @admin_role_id = (
  SELECT `id`
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'ADMIN'
  ORDER BY `role_name` = 'Admin' DESC, `id` ASC
  LIMIT 1
);

SET @employee_role_id = (
  SELECT `id`
  FROM `roles`
  WHERE UPPER(REPLACE(`role_name`, ' ', '_')) = 'EMPLOYEE'
  ORDER BY `role_name` = 'Employee' DESC, `id` ASC
  LIMIT 1
);

UPDATE `users`
JOIN `roles`
  ON `roles`.`id` = `users`.`role_id`
SET `users`.`role_id` = CASE
  WHEN UPPER(REPLACE(`roles`.`role_name`, ' ', '_')) = 'SUPER_ADMIN'
    THEN @super_admin_role_id
  WHEN UPPER(REPLACE(`roles`.`role_name`, ' ', '_')) = 'EMPLOYEE'
    THEN @employee_role_id
  ELSE @admin_role_id
END;

DELETE FROM `role_permissions`;

DELETE FROM `roles`
WHERE `id` NOT IN (
  @super_admin_role_id,
  @admin_role_id,
  @employee_role_id
);

UPDATE `roles`
SET `role_name` = 'Super Admin'
WHERE `id` = @super_admin_role_id;

UPDATE `roles`
SET `role_name` = 'Admin'
WHERE `id` = @admin_role_id;

UPDATE `roles`
SET `role_name` = 'Employee'
WHERE `id` = @employee_role_id;

UPDATE `permissions`
SET `permission_name` = UPPER(REPLACE(REPLACE(`permission_name`, '-', '_'), ' ', '_'));

INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('CREATE_ADMIN'),
  ('VIEW_ADMINS'),
  ('UPDATE_ADMIN'),
  ('DELETE_ADMIN'),
  ('CREATE_DEPARTMENT'),
  ('VIEW_DEPARTMENTS'),
  ('UPDATE_DEPARTMENT'),
  ('DELETE_DEPARTMENT'),
  ('CREATE_EMPLOYEE'),
  ('VIEW_EMPLOYEES'),
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
WHERE `roles`.`role_name` = 'Super Admin'
  AND `permissions`.`permission_name` IN (
    'CREATE_ADMIN',
    'VIEW_ADMINS',
    'UPDATE_ADMIN',
    'DELETE_ADMIN',
    'CREATE_DEPARTMENT',
    'VIEW_DEPARTMENTS',
    'UPDATE_DEPARTMENT',
    'DELETE_DEPARTMENT',
    'CREATE_EMPLOYEE',
    'VIEW_EMPLOYEES',
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
WHERE `roles`.`role_name` = 'Admin'
  AND `permissions`.`permission_name` IN (
    'CREATE_EMPLOYEE',
    'VIEW_EMPLOYEES',
    'UPDATE_EMPLOYEE',
    'DELETE_EMPLOYEE',
    'IMPORT_ATTENDANCE',
    'VIEW_SYSTEM_SUMMARY',
    'VIEW_REPORTS',
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVES',
    'VIEW_TEAM_LEAVES',
    'VIEW_ALL_LEAVES',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'Employee'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_OWN_LEAVES',
    'CANCEL_LEAVE'
  );

DELETE FROM `permissions`
WHERE `permission_name` NOT IN (
  'CREATE_ADMIN',
  'VIEW_ADMINS',
  'UPDATE_ADMIN',
  'DELETE_ADMIN',
  'CREATE_DEPARTMENT',
  'VIEW_DEPARTMENTS',
  'UPDATE_DEPARTMENT',
  'DELETE_DEPARTMENT',
  'CREATE_EMPLOYEE',
  'VIEW_EMPLOYEES',
  'UPDATE_EMPLOYEE',
  'DELETE_EMPLOYEE',
  'IMPORT_ATTENDANCE',
  'VIEW_SYSTEM_SUMMARY',
  'VIEW_TEAM_ATTENDANCE',
  'VIEW_OWN_ATTENDANCE',
  'VIEW_REPORTS',
  'CREATE_LEAVE',
  'VIEW_OWN_LEAVES',
  'VIEW_TEAM_LEAVES',
  'VIEW_ALL_LEAVES',
  'APPROVE_LEAVE',
  'REJECT_LEAVE',
  'CANCEL_LEAVE'
);
