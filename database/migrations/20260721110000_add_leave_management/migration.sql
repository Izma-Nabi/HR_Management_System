ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_requester_id_fkey`;
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_approver_id_fkey`;

ALTER TABLE `leave_requests`
  CHANGE COLUMN `requester_id` `user_id` INT UNSIGNED NOT NULL,
  DROP COLUMN `approver_id`,
  DROP COLUMN `decision_note`,
  DROP COLUMN `decided_at`;

ALTER TABLE `leave_requests`
  ADD COLUMN `total_days` INT NULL AFTER `end_date`,
  ADD COLUMN `current_approval_level` INT NOT NULL DEFAULT 1 AFTER `status`,
  ADD COLUMN `current_refers_to` INT UNSIGNED NULL AFTER `current_approval_level`;

UPDATE `leave_requests`
SET `total_days` = GREATEST(DATEDIFF(`end_date`, `start_date`) + 1, 1)
WHERE `total_days` IS NULL;

ALTER TABLE `leave_requests`
  MODIFY COLUMN `type` ENUM('ANNUAL', 'CASUAL', 'SICK', 'UNPAID', 'OTHER') NOT NULL,
  MODIFY COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  MODIFY COLUMN `total_days` INT NOT NULL;

ALTER TABLE `leave_requests`
  ADD INDEX `leave_requests_current_refers_to_idx` (`current_refers_to`),
  ADD CONSTRAINT `leave_requests_user_id_fkey`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_current_refers_to_fkey`
    FOREIGN KEY (`current_refers_to`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL;

CREATE TABLE `leave_approvals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leave_request_id` INT UNSIGNED NOT NULL,
  `refers_to` INT UNSIGNED NOT NULL,
  `approval_level` INT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `decision_note` TEXT NULL,
  `decided_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `leave_approvals_leave_request_id_idx` (`leave_request_id`),
  INDEX `leave_approvals_refers_to_idx` (`refers_to`),
  INDEX `leave_approvals_status_idx` (`status`),
  CONSTRAINT `leave_approvals_leave_request_id_fkey`
    FOREIGN KEY (`leave_request_id`)
    REFERENCES `leave_requests`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `leave_approvals_refers_to_fkey`
    FOREIGN KEY (`refers_to`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `leave_approval_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leave_request_id` INT UNSIGNED NOT NULL,
  `refers_to` INT UNSIGNED NOT NULL,
  `approval_level` INT NOT NULL,
  `action` ENUM('APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `leave_approval_history_leave_request_id_idx` (`leave_request_id`),
  INDEX `leave_approval_history_refers_to_idx` (`refers_to`),
  INDEX `leave_approval_history_action_idx` (`action`),
  CONSTRAINT `leave_approval_history_leave_request_id_fkey`
    FOREIGN KEY (`leave_request_id`)
    REFERENCES `leave_requests`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `leave_approval_history_refers_to_fkey`
    FOREIGN KEY (`refers_to`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `permissions` (`permission_name`) VALUES
  ('CREATE_LEAVE'),
  ('VIEW_OWN_LEAVE'),
  ('VIEW_TEAM_LEAVE'),
  ('VIEW_ALL_LEAVES'),
  ('APPROVE_LEAVE'),
  ('REJECT_LEAVE'),
  ('CANCEL_LEAVE');

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'SUPER ADMIN'
  AND `permissions`.`permission_name` IN (
    'VIEW_ALL_LEAVES',
    'VIEW_TEAM_LEAVE',
    'APPROVE_LEAVE',
    'REJECT_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'ADMIN'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVE',
    'VIEW_ALL_LEAVES',
    'VIEW_TEAM_LEAVE',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'PROJECT MANAGER'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVE',
    'VIEW_TEAM_LEAVE',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'CANCEL_LEAVE'
  );

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT `roles`.`id`, `permissions`.`id`
FROM `roles`
JOIN `permissions`
WHERE `roles`.`role_name` = 'EMPLOYEE'
  AND `permissions`.`permission_name` IN (
    'CREATE_LEAVE',
    'VIEW_OWN_LEAVE',
    'CANCEL_LEAVE'
  );
