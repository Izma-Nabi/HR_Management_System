INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('VIEW_DESIGNATIONS'),
  ('CREATE_DESIGNATION'),
  ('UPDATE_DESIGNATION'),
  ('DELETE_DESIGNATION');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` IN ('Super Admin', 'SUPER ADMIN', 'SUPER_ADMIN')
  AND `permissions`.`permission_name` IN (
    'VIEW_DESIGNATIONS',
    'CREATE_DESIGNATION',
    'UPDATE_DESIGNATION',
    'DELETE_DESIGNATION'
  );
