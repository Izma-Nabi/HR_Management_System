CREATE TABLE IF NOT EXISTS `employee_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `employee_code` VARCHAR(50) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `address` VARCHAR(255) NULL,
  `photo` VARCHAR(255) NULL,
  `department` VARCHAR(100) NULL,
  `designation` VARCHAR(100) NULL,
  `joining_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_profiles_user_id_unique` (`user_id`),
  UNIQUE KEY `employee_profiles_employee_code_unique` (`employee_code`),

  CONSTRAINT `employee_profiles_user_id_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `employee_profiles` (
  `user_id`,
  `employee_code`,
  `first_name`,
  `last_name`,
  `phone`,
  `department`,
  `designation`,
  `joining_date`,
  `created_at`,
  `updated_at`
)
SELECT
  `employees`.`user_id`,
  `employees`.`employee_code`,
  TRIM(SUBSTRING_INDEX(`employees`.`name`, ' ', 1)),
  COALESCE(
    NULLIF(
      TRIM(
        CASE
          WHEN LOCATE(' ', `employees`.`name`) > 0
            THEN SUBSTRING(`employees`.`name`, LOCATE(' ', `employees`.`name`) + 1)
          ELSE ''
        END
      ),
      ''
    ),
    TRIM(SUBSTRING_INDEX(`employees`.`name`, ' ', 1))
  ),
  `employees`.`phone`,
  `employees`.`department`,
  `employees`.`designation`,
  `employees`.`joining_date`,
  `employees`.`created_at`,
  `employees`.`updated_at`
FROM `employees`
WHERE NOT EXISTS (
  SELECT 1
  FROM `employee_profiles`
  WHERE `employee_profiles`.`user_id` = `employees`.`user_id`
);

DROP TABLE IF EXISTS `employees`;
