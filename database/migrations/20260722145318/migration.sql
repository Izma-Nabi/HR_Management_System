/*
  Warnings:

  - Made the column `created_at` on table `attendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `attendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `leave_approval_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `leave_approvals` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `leave_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `admin_departments` DROP FOREIGN KEY `fk_admin_departments_department`;

-- DropForeignKey
ALTER TABLE `admin_departments` DROP FOREIGN KEY `fk_admin_departments_user`;

-- DropForeignKey
ALTER TABLE `leave_approval_history` DROP FOREIGN KEY `fk_leavehistory_refers`;

-- DropForeignKey
ALTER TABLE `leave_approval_history` DROP FOREIGN KEY `fk_leavehistory_request`;

-- DropForeignKey
ALTER TABLE `leave_approvals` DROP FOREIGN KEY `fk_leaveapproval_refers`;

-- DropForeignKey
ALTER TABLE `leave_approvals` DROP FOREIGN KEY `fk_leaveapproval_request`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `fk_leave_current_refers`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `fk_leave_request_user`;

-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_ibfk_1`;

-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_ibfk_2`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `fk_users_department`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_ibfk_1`;

-- DropIndex
DROP INDEX `idx_action` ON `leave_approval_history`;

-- AlterTable
ALTER TABLE `attendance` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `leave_approval_history` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `leave_approvals` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `leave_requests` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_departments` ADD CONSTRAINT `admin_departments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_departments` ADD CONSTRAINT `admin_departments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_current_refers_to_fkey` FOREIGN KEY (`current_refers_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `leave_approvals_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `leave_approvals_refers_to_fkey` FOREIGN KEY (`refers_to`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approval_history` ADD CONSTRAINT `leave_approval_history_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_approval_history` ADD CONSTRAINT `leave_approval_history_refers_to_fkey` FOREIGN KEY (`refers_to`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `idx_department_id` TO `admin_departments_department_id_idx`;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `idx_user_id` TO `admin_departments_user_id_idx`;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `uq_user_department` TO `admin_departments_user_id_department_id_key`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `attendance_source_key_unique` TO `attendance_source_key_key`;

-- RenameIndex
ALTER TABLE `departments` RENAME INDEX `department_name` TO `departments_department_name_key`;

-- RenameIndex
ALTER TABLE `leave_approval_history` RENAME INDEX `idx_leave_request` TO `leave_approval_history_leave_request_id_idx`;

-- RenameIndex
ALTER TABLE `leave_approval_history` RENAME INDEX `idx_refers_to` TO `leave_approval_history_refers_to_idx`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `idx_leave_request` TO `leave_approvals_leave_request_id_idx`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `idx_refers_to` TO `leave_approvals_refers_to_idx`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `idx_status` TO `leave_approvals_status_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `idx_current_refers` TO `leave_requests_current_refers_to_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `idx_status` TO `leave_requests_status_idx`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `idx_user` TO `leave_requests_user_id_idx`;

-- RenameIndex
ALTER TABLE `permissions` RENAME INDEX `permission_name` TO `permissions_permission_name_key`;

-- RenameIndex
ALTER TABLE `roles` RENAME INDEX `role_name` TO `roles_role_name_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `email` TO `users_email_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `fk_users_department` TO `users_department_id_idx`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `role_id` TO `users_role_id_idx`;
