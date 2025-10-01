-- CreateTable
CREATE TABLE `Elusion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFundicionEstimada` DATETIME(3) NOT NULL,
    `numeroLinea` VARCHAR(191) NOT NULL,
    `validada` BOOLEAN NOT NULL DEFAULT false,
    `alianzaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Elusion` ADD CONSTRAINT `Elusion_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
