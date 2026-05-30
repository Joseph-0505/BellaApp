-- AlterTable
ALTER TABLE `Appointment`
	ADD COLUMN `receivedBy` ENUM('CLINIC', 'PROFESSIONAL') NOT NULL DEFAULT 'CLINIC';

-- CreateTable
CREATE TABLE `Billing` (
	`id` VARCHAR(191) NOT NULL,
	`userId` VARCHAR(191) NOT NULL,
	`appointmentId` VARCHAR(191) NULL,
	`appointmentScheduledAt` DATETIME(3) NOT NULL,
	`clientId` VARCHAR(191) NOT NULL,
	`clientName` VARCHAR(191) NOT NULL,
	`serviceId` VARCHAR(191) NOT NULL,
	`serviceName` VARCHAR(191) NOT NULL,
	`professionalId` VARCHAR(191) NULL,
	`professionalName` VARCHAR(191) NULL,
	`amount` DECIMAL(10, 2) NOT NULL,
	`paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
	`remainingAmount` DECIMAL(10, 2) NOT NULL,
	`status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'PENDING',
	`receivedBy` ENUM('CLINIC', 'PROFESSIONAL') NOT NULL DEFAULT 'CLINIC',
	`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` DATETIME(3) NOT NULL,

	UNIQUE INDEX `Billing_appointmentId_key`(`appointmentId`),
	INDEX `Billing_userId_idx`(`userId`),
	INDEX `Billing_userId_status_idx`(`userId`, `status`),
	INDEX `Billing_userId_createdAt_idx`(`userId`, `createdAt`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashRegister` (
	`id` VARCHAR(191) NOT NULL,
	`userId` VARCHAR(191) NOT NULL,
	`registerDate` DATETIME(3) NOT NULL,
	`status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
	`totalPaidSnapshot` DECIMAL(10, 2) NOT NULL DEFAULT 0,
	`totalExpensesSnapshot` DECIMAL(10, 2) NOT NULL DEFAULT 0,
	`totalBalanceSnapshot` DECIMAL(10, 2) NOT NULL DEFAULT 0,
	`closedAt` DATETIME(3) NULL,
	`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` DATETIME(3) NOT NULL,

	UNIQUE INDEX `CashRegister_userId_registerDate_key`(`userId`, `registerDate`),
	INDEX `CashRegister_userId_idx`(`userId`),
	INDEX `CashRegister_userId_status_idx`(`userId`, `status`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CashMovement` (
	`id` VARCHAR(191) NOT NULL,
	`userId` VARCHAR(191) NOT NULL,
	`billingId` VARCHAR(191) NULL,
	`cashRegisterId` VARCHAR(191) NULL,
	`type` ENUM('INCOME', 'EXPENSE') NOT NULL,
	`status` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PAID',
	`paymentMethod` ENUM('CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'OTHER') NULL,
	`description` VARCHAR(191) NULL,
	`amount` DECIMAL(10, 2) NOT NULL,
	`countsInCash` BOOLEAN NOT NULL DEFAULT true,
	`occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` DATETIME(3) NOT NULL,

	INDEX `CashMovement_userId_idx`(`userId`),
	INDEX `CashMovement_billingId_idx`(`billingId`),
	INDEX `CashMovement_cashRegisterId_idx`(`cashRegisterId`),
	INDEX `CashMovement_userId_occurredAt_idx`(`userId`, `occurredAt`),
	PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_userId_fkey`
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_appointmentId_fkey`
	FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_userId_fkey`
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_userId_fkey`
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_billingId_fkey`
	FOREIGN KEY (`billingId`) REFERENCES `Billing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_cashRegisterId_fkey`
	FOREIGN KEY (`cashRegisterId`) REFERENCES `CashRegister`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
