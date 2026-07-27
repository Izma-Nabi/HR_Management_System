INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('VIEW_ROLES'),
  ('CREATE_ROLE'),
  ('UPDATE_ROLE'),
  ('DELETE_ROLE');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` IN ('Super Admin', 'SUPER ADMIN', 'SUPER_ADMIN')
  AND `permissions`.`permission_name` IN (
    'VIEW_ROLES',
    'CREATE_ROLE',
    'UPDATE_ROLE',
    'DELETE_ROLE'
  );
