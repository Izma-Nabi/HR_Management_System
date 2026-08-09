SET @leave_approval_action_exists = (
  SELECT COUNT(*)
  FROM `information_schema`.`COLUMNS`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'leave_approvals'
    AND `COLUMN_NAME` = 'action'
);

SET @add_leave_approval_action = IF(
  @leave_approval_action_exists = 0,
  'ALTER TABLE `leave_approvals` ADD COLUMN `action` ENUM(''SUBMITTED'', ''APPROVED'', ''REJECTED'', ''CANCELLED'') NOT NULL DEFAULT ''SUBMITTED'' AFTER `status`',
  'SELECT 1'
);

PREPARE add_leave_approval_action_statement FROM @add_leave_approval_action;
EXECUTE add_leave_approval_action_statement;
DEALLOCATE PREPARE add_leave_approval_action_statement;

CREATE TABLE IF NOT EXISTS `leave_approval_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leave_request_id` INT UNSIGNED NOT NULL,
  `refers_to` INT UNSIGNED NOT NULL,
  `approval_level` INT NOT NULL,
  `action` ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
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

ALTER TABLE `leave_approval_history`
  MODIFY COLUMN `action`
    ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL;
