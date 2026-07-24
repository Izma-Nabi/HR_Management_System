INSERT IGNORE INTO `permissions` (`permission_name`)
VALUES ('UPDATE_USER');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
  ON `permissions`.`permission_name` = 'UPDATE_USER'
WHERE UPPER(REPLACE(`roles`.`role_name`, ' ', '_')) IN (
  'SUPER_ADMIN',
  'ADMIN'
);
