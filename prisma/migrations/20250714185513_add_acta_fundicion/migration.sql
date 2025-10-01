-- CreateTable
CREATE TABLE `ActaFundicion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectorId` INTEGER NOT NULL,
    `alianzaId` INTEGER NOT NULL,
    `rifAlianza` VARCHAR(191) NOT NULL,
    `fechaFundicion` DATETIME(3) NOT NULL,
    `numeroActa` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ActaFundicion_numeroActa_key`(`numeroActa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BarraFundida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaId` INTEGER NOT NULL,
    `numeroBarra` INTEGER NOT NULL,
    `totalBruto` DOUBLE NOT NULL,
    `promedioLey` DOUBLE NOT NULL,
    `totalFino` DOUBLE NOT NULL,
    `pesoBarra` DOUBLE NOT NULL,
    `precintoBarra` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActaFundicion` ADD CONSTRAINT `ActaFundicion_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaFundicion` ADD CONSTRAINT `ActaFundicion_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BarraFundida` ADD CONSTRAINT `BarraFundida_actaId_fkey` FOREIGN KEY (`actaId`) REFERENCES `ActaFundicion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
