-- AlterTable
ALTER TABLE `User`
    MODIFY `passwordHash` VARCHAR(191) NULL,
    MODIFY `cpf` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `InviteToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InviteToken_token_key`(`token`),
    INDEX `InviteToken_userId_usedAt_expiresAt_idx`(`userId`, `usedAt`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InviteToken`
    ADD CONSTRAINT `InviteToken_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
