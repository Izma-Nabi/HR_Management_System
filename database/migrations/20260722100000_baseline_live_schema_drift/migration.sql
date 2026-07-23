-- DropForeignKey
ALTER TABLE `admin_departments` DROP FOREIGN KEY `admin_departments_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `admin_departments` DROP FOREIGN KEY `admin_departments_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `admin_profiles` DROP FOREIGN KEY `admin_profiles_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `admin_profiles` DROP FOREIGN KEY `admin_profiles_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `employee_profiles` DROP FOREIGN KEY `employee_profiles_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `employee_profiles` DROP FOREIGN KEY `employee_profiles_user_id_fk`;

-- DropForeignKey
ALTER TABLE `leave_approval_history` DROP FOREIGN KEY `leave_approval_history_leave_request_id_fkey`;

-- DropForeignKey
ALTER TABLE `leave_approval_history` DROP FOREIGN KEY `leave_approval_history_refers_to_fkey`;

-- DropForeignKey
ALTER TABLE `leave_approvals` DROP FOREIGN KEY `leave_approvals_leave_request_id_fkey`;

-- DropForeignKey
ALTER TABLE `leave_approvals` DROP FOREIGN KEY `leave_approvals_refers_to_fkey`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_current_refers_to_fkey`;

-- DropForeignKey
ALTER TABLE `leave_requests` DROP FOREIGN KEY `leave_requests_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_permission_id_fkey`;

-- DropForeignKey
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_role_id_fkey`;

-- DropIndex
DROP INDEX `leave_requests_start_date_end_date_idx` ON `leave_requests`;

-- DropIndex
DROP INDEX `users_role_idx` ON `users`;

-- AlterTable
ALTER TABLE `attendance` DROP PRIMARY KEY,
    MODIFY `id` int NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id` ASC);

-- AlterTable
ALTER TABLE `leave_approval_history` MODIFY `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `leave_approvals` MODIFY `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `leave_requests` MODIFY `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `users` DROP COLUMN `full_name`,
    DROP COLUMN `role`,
    ADD COLUMN `department_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NULL DEFAULT 'ACTIVE',
    MODIFY `firstName` varchar(100) NOT NULL,
    MODIFY `lastName` varchar(100) NOT NULL,
    MODIFY `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP(0);

-- DropTable
DROP TABLE `admin_profiles`;

-- DropTable
DROP TABLE `employee_profiles`;

-- CreateIndex
CREATE INDEX `fk_users_department` ON `users`(`department_id` ASC);

-- CreateIndex
CREATE INDEX `permission_id` ON `role_permissions`(`permission_id` ASC);

-- AddForeignKey
ALTER TABLE `admin_departments` ADD CONSTRAINT `fk_admin_departments_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `admin_departments` ADD CONSTRAINT `fk_admin_departments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_approval_history` ADD CONSTRAINT `fk_leavehistory_refers` FOREIGN KEY (`refers_to`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_approval_history` ADD CONSTRAINT `fk_leavehistory_request` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `fk_leaveapproval_refers` FOREIGN KEY (`refers_to`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_approvals` ADD CONSTRAINT `fk_leaveapproval_request` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `fk_leave_current_refers` FOREIGN KEY (`current_refers_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `fk_leave_request_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `admin_departments_department_id_idx` TO `idx_department_id`;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `admin_departments_user_id_department_id_key` TO `uq_user_department`;

-- RenameIndex
ALTER TABLE `admin_departments` RENAME INDEX `admin_departments_user_id_idx` TO `idx_user_id`;

-- RenameIndex
ALTER TABLE `departments` RENAME INDEX `departments_department_name_key` TO `department_name`;

-- RenameIndex
ALTER TABLE `leave_approval_history` RENAME INDEX `leave_approval_history_action_idx` TO `idx_action`;

-- RenameIndex
ALTER TABLE `leave_approval_history` RENAME INDEX `leave_approval_history_leave_request_id_idx` TO `idx_leave_request`;

-- RenameIndex
ALTER TABLE `leave_approval_history` RENAME INDEX `leave_approval_history_refers_to_idx` TO `idx_refers_to`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `leave_approvals_leave_request_id_idx` TO `idx_leave_request`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `leave_approvals_refers_to_idx` TO `idx_refers_to`;

-- RenameIndex
ALTER TABLE `leave_approvals` RENAME INDEX `leave_approvals_status_idx` TO `idx_status`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_current_refers_to_idx` TO `idx_current_refers`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_requester_id_idx` TO `idx_user`;

-- RenameIndex
ALTER TABLE `leave_requests` RENAME INDEX `leave_requests_status_idx` TO `idx_status`;

-- RenameIndex
ALTER TABLE `permissions` RENAME INDEX `permissions_permission_name_key` TO `permission_name`;

-- RenameIndex
ALTER TABLE `roles` RENAME INDEX `roles_role_name_key` TO `role_name`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_email_key` TO `email`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `users_role_id_idx` TO `role_id`;
