-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
