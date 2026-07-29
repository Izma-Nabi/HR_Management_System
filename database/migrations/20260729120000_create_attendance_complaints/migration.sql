CREATE TABLE `attendance_complaints` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER UNSIGNED NOT NULL,
  `daily_attendance_id` INTEGER NOT NULL,
  `raw_attendance_id` INTEGER NOT NULL,
  `attendance_date` DATE NOT NULL,
  `complaint_type` ENUM(
    'CHECK_IN',
    'CHECK_OUT',
    'BOTH',
    'STATUS',
    'OTHER'
  ) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM(
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING',
  `review_note` TEXT NULL,
  `reviewed_at` DATETIME(0) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `attendance_complaints_user_id_attendance_date_idx`(
    `user_id`,
    `attendance_date`
  ),
  INDEX `attendance_complaints_daily_attendance_id_idx`(
    `daily_attendance_id`
  ),
  INDEX `attendance_complaints_raw_attendance_id_idx`(
    `raw_attendance_id`
  ),
  INDEX `attendance_complaints_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `attendance_complaints`
  ADD CONSTRAINT `attendance_complaints_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `attendance_complaints`
  ADD CONSTRAINT `attendance_complaints_raw_attendance_id_fkey`
  FOREIGN KEY (`raw_attendance_id`) REFERENCES `attendance`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
