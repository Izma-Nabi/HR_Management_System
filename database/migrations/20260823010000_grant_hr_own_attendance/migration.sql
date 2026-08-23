INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` IN ('HR', 'Human Resources', 'HUMAN_RESOURCES')
  AND `permissions`.`permission_name` = 'VIEW_OWN_ATTENDANCE';
