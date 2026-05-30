-- CreateTable
CREATE TABLE `Clinic` (
    `id` VARCHAR(191) NOT NULL,
    `plan` ENUM('INDIVIDUAL', 'TEAM') NOT NULL DEFAULT 'INDIVIDUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClinicUser` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'PROFESSIONAL') NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClinicUser_professionalId_key`(`professionalId`),
    INDEX `ClinicUser_userId_idx`(`userId`),
    INDEX `ClinicUser_clinicId_role_idx`(`clinicId`, `role`),
    UNIQUE INDEX `ClinicUser_clinicId_userId_key`(`clinicId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Billing` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `BusinessProfile` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CashMovement`
    ADD COLUMN `clinicId` VARCHAR(191) NULL,
    ADD COLUMN `professionalId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CashRegister`
    ADD COLUMN `clinicId` VARCHAR(191) NULL,
    ADD COLUMN `differenceAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `informedClosingAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `openedAt` DATETIME(3) NULL,
    ADD COLUMN `openingAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `professionalId` VARCHAR(191) NULL,
    ADD COLUMN `scopeKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Professional` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Room` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Service` ADD COLUMN `clinicId` VARCHAR(191) NULL;

-- Create a temporary user -> clinic map so current user-scoped data can be preserved.
CREATE TABLE `_UserClinicMap` (
    `userId` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(32) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_UserClinicMap` (`userId`, `clinicId`, `plan`)
SELECT
    `u`.`id`,
    UUID(),
    CASE WHEN COALESCE(`bp`.`hasTeam`, 0) = 1 THEN 'TEAM' ELSE 'INDIVIDUAL' END
FROM `User` `u`
LEFT JOIN `BusinessProfile` `bp` ON `bp`.`userId` = `u`.`id`;

INSERT INTO `Clinic` (`id`, `plan`, `createdAt`, `updatedAt`)
SELECT
    `map`.`clinicId`,
    `map`.`plan`,
    COALESCE(`bp`.`createdAt`, `u`.`createdAt`),
    NOW(3)
FROM `_UserClinicMap` `map`
INNER JOIN `User` `u` ON `u`.`id` = `map`.`userId`
LEFT JOIN `BusinessProfile` `bp` ON `bp`.`userId` = `u`.`id`;

UPDATE `BusinessProfile` `bp`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `bp`.`userId`
SET `bp`.`clinicId` = `map`.`clinicId`;

UPDATE `Client` `c`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `c`.`userId`
SET `c`.`clinicId` = `map`.`clinicId`;

UPDATE `Service` `s`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `s`.`userId`
SET `s`.`clinicId` = `map`.`clinicId`;

UPDATE `Professional` `p`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `p`.`userId`
SET `p`.`clinicId` = `map`.`clinicId`;

UPDATE `Room` `r`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `r`.`userId`
SET `r`.`clinicId` = `map`.`clinicId`;

UPDATE `Appointment` `a`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `a`.`userId`
SET `a`.`clinicId` = `map`.`clinicId`;

UPDATE `Billing` `b`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `b`.`userId`
SET `b`.`clinicId` = `map`.`clinicId`;

UPDATE `CashRegister` `cr`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `cr`.`userId`
SET
    `cr`.`clinicId` = `map`.`clinicId`,
    `cr`.`scopeKey` = 'clinic',
    `cr`.`openedAt` = COALESCE(`cr`.`createdAt`, NOW(3));

UPDATE `CashMovement` `cm`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `cm`.`userId`
LEFT JOIN `Billing` `b` ON `b`.`id` = `cm`.`billingId`
SET
    `cm`.`clinicId` = `map`.`clinicId`,
    `cm`.`professionalId` = CASE
        WHEN `b`.`receivedBy` = 'PROFESSIONAL' THEN `b`.`professionalId`
        ELSE NULL
    END;

-- Guarantee one default professional linked to each existing clinic owner.
INSERT INTO `Professional` (
    `id`,
    `userId`,
    `clinicId`,
    `name`,
    `specialty`,
    `email`,
    `phone`,
    `status`,
    `createdAt`,
    `updatedAt`
)
SELECT
    UUID(),
    `u`.`id`,
    `map`.`clinicId`,
    `u`.`name`,
    'Atendimento geral',
    `u`.`email`,
    'A definir',
    true,
    NOW(3),
    NOW(3)
FROM `User` `u`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `u`.`id`
WHERE NOT EXISTS (
    SELECT 1
    FROM `Professional` `p`
    WHERE `p`.`clinicId` = `map`.`clinicId`
);

INSERT INTO `ClinicUser` (
    `id`,
    `clinicId`,
    `userId`,
    `professionalId`,
    `role`,
    `createdAt`,
    `updatedAt`
)
SELECT
    UUID(),
    `map`.`clinicId`,
    `u`.`id`,
    (
        SELECT `p`.`id`
        FROM `Professional` `p`
        WHERE `p`.`clinicId` = `map`.`clinicId`
        ORDER BY
            CASE WHEN `p`.`userId` = `u`.`id` THEN 0 ELSE 1 END,
            `p`.`createdAt` ASC,
            `p`.`id` ASC
        LIMIT 1
    ),
    'ADMIN',
    NOW(3),
    NOW(3)
FROM `User` `u`
INNER JOIN `_UserClinicMap` `map` ON `map`.`userId` = `u`.`id`;

DROP TABLE `_UserClinicMap`;

-- Tighten nullability after the backfill.
ALTER TABLE `Appointment` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `Billing` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `CashMovement` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `CashRegister`
    MODIFY `clinicId` VARCHAR(191) NOT NULL,
    MODIFY `openedAt` DATETIME(3) NOT NULL,
    MODIFY `scopeKey` VARCHAR(191) NOT NULL;
ALTER TABLE `Client` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `Professional` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `Room` MODIFY `clinicId` VARCHAR(191) NOT NULL;
ALTER TABLE `Service` MODIFY `clinicId` VARCHAR(191) NOT NULL;

-- Replace old user-scoped uniques with clinic-scoped equivalents.
DROP INDEX `CashRegister_userId_registerDate_key` ON `CashRegister`;
DROP INDEX `Client_userId_cpf_key` ON `Client`;
DROP INDEX `Room_userId_name_key` ON `Room`;

CREATE INDEX `Appointment_clinicId_idx` ON `Appointment`(`clinicId`);
CREATE INDEX `Appointment_clinicId_scheduledAt_idx` ON `Appointment`(`clinicId`, `scheduledAt`);
CREATE UNIQUE INDEX `BusinessProfile_clinicId_key` ON `BusinessProfile`(`clinicId`);
CREATE INDEX `Billing_clinicId_idx` ON `Billing`(`clinicId`);
CREATE INDEX `Billing_clinicId_status_idx` ON `Billing`(`clinicId`, `status`);
CREATE INDEX `Billing_clinicId_createdAt_idx` ON `Billing`(`clinicId`, `createdAt`);
CREATE INDEX `CashMovement_clinicId_idx` ON `CashMovement`(`clinicId`);
CREATE INDEX `CashMovement_professionalId_idx` ON `CashMovement`(`professionalId`);
CREATE INDEX `CashMovement_clinicId_occurredAt_idx` ON `CashMovement`(`clinicId`, `occurredAt`);
CREATE INDEX `CashRegister_clinicId_idx` ON `CashRegister`(`clinicId`);
CREATE INDEX `CashRegister_clinicId_status_idx` ON `CashRegister`(`clinicId`, `status`);
CREATE INDEX `CashRegister_clinicId_professionalId_registerDate_idx` ON `CashRegister`(`clinicId`, `professionalId`, `registerDate`);
CREATE UNIQUE INDEX `CashRegister_clinicId_registerDate_scopeKey_key` ON `CashRegister`(`clinicId`, `registerDate`, `scopeKey`);
CREATE INDEX `Client_clinicId_idx` ON `Client`(`clinicId`);
CREATE UNIQUE INDEX `Client_clinicId_cpf_key` ON `Client`(`clinicId`, `cpf`);
CREATE INDEX `Professional_clinicId_idx` ON `Professional`(`clinicId`);
CREATE INDEX `Room_clinicId_idx` ON `Room`(`clinicId`);
CREATE UNIQUE INDEX `Room_clinicId_name_key` ON `Room`(`clinicId`, `name`);
CREATE INDEX `Service_clinicId_idx` ON `Service`(`clinicId`);

ALTER TABLE `ClinicUser` ADD CONSTRAINT `ClinicUser_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClinicUser` ADD CONSTRAINT `ClinicUser_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClinicUser` ADD CONSTRAINT `ClinicUser_professionalId_fkey`
    FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `BusinessProfile` ADD CONSTRAINT `BusinessProfile_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Client` ADD CONSTRAINT `Client_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Service` ADD CONSTRAINT `Service_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Professional` ADD CONSTRAINT `Professional_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Room` ADD CONSTRAINT `Room_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Billing` ADD CONSTRAINT `Billing_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_professionalId_fkey`
    FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_professionalId_fkey`
    FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;