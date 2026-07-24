-- Add missing designation column expected by the current Prisma schema and app code.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `designation` VARCHAR(100) NULL AFTER `photo`;
