-- Combined backend migration.
-- Adds the SUPER_ADMIN role used by the admin module and indexes common filters.

ALTER TABLE `users`
  MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE';

CREATE INDEX `users_role_idx` ON `users`(`role`);
CREATE INDEX `users_status_idx` ON `users`(`status`);
