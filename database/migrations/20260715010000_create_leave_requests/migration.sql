CREATE TABLE `leave_requests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `requester_id` INT UNSIGNED NOT NULL,
  `approver_id` INT UNSIGNED NULL,
  `type` ENUM('ANNUAL', 'SICK', 'CASUAL', 'UNPAID', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `reason` TEXT NULL,
  `decision_note` TEXT NULL,
  `decided_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `leave_requests_requester_id_idx` (`requester_id`),
  INDEX `leave_requests_approver_id_idx` (`approver_id`),
  INDEX `leave_requests_status_idx` (`status`),
  INDEX `leave_requests_start_date_end_date_idx` (`start_date`, `end_date`),
  CONSTRAINT `leave_requests_requester_id_fkey`
    FOREIGN KEY (`requester_id`)
    REFERENCES `users`(`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `leave_requests_approver_id_fkey`
    FOREIGN KEY (`approver_id`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
