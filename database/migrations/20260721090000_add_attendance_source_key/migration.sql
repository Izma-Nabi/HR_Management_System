ALTER TABLE `attendance`
  ADD COLUMN `source_key` VARCHAR(128) NULL,
  ADD UNIQUE INDEX `attendance_source_key_unique` (`source_key`);
