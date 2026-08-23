INSERT IGNORE INTO `roles` (`role_name`) VALUES
  ('HR'),
  ('Team Lead');

INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('LIST_LEAVE_REQUESTS'),
  ('ACCEPT_LEAVE_REQUEST'),
  ('REJECT_LEAVE_REQUEST');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` IN ('Super Admin', 'SUPER ADMIN', 'SUPER_ADMIN', 'Admin', 'ADMIN')
  AND `permissions`.`permission_name` IN (
    'LIST_LEAVE_REQUESTS',
    'ACCEPT_LEAVE_REQUEST',
    'REJECT_LEAVE_REQUEST'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'HR'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVES',
    'VIEW_ALL_LEAVES',
    'LIST_LEAVE_REQUESTS',
    'ACCEPT_LEAVE_REQUEST',
    'REJECT_LEAVE_REQUEST',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'Team Lead'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_OWN_LEAVES',
    'VIEW_TEAM_LEAVES',
    'LIST_LEAVE_REQUESTS',
    'ACCEPT_LEAVE_REQUEST',
    'REJECT_LEAVE_REQUEST',
    'CANCEL_LEAVE'
  );

UPDATE `users`
JOIN `designations`
  ON `designations`.`id` = `users`.`designation_id`
JOIN `roles`
  ON `roles`.`role_name` = 'Team Lead'
SET `users`.`role_id` = `roles`.`id`
WHERE LOWER(`designations`.`designation_name`) LIKE '%team lead%'
   OR LOWER(`designations`.`designation_name`) LIKE '%project manager%';
