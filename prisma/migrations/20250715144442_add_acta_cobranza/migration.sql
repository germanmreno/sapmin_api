-- CreateTable
CREATE TABLE `ActaCobranza` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaFundicionId` INTEGER NOT NULL,
    `correlativo` VARCHAR(191) NOT NULL,
    `hora` DATETIME(3) NOT NULL,
    `totalCobranza` DOUBLE NOT NULL,
    `estado` ENUM('PENDIENTE', 'SALDADA') NOT NULL DEFAULT 'PENDIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActaCobranza` ADD CONSTRAINT `ActaCobranza_actaFundicionId_fkey` FOREIGN KEY (`actaFundicionId`) REFERENCES `ActaFundicion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
