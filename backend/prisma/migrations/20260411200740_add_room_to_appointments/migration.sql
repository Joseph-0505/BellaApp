-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `roomId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Appointment_roomId_idx` ON `Appointment`(`roomId`);

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
