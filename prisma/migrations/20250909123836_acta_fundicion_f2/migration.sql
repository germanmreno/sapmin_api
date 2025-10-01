-- CreateTable
CREATE TABLE `BarraDeOro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identificador` VARCHAR(191) NOT NULL,
    `pesoBruto` DOUBLE NOT NULL,
    `tipoLey` DOUBLE NOT NULL,
    `pesoFino` DOUBLE NOT NULL,
    `origen` VARCHAR(191) NOT NULL,
    `alianzaId` INTEGER NULL,
    `refundida` BOOLEAN NOT NULL DEFAULT false,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observaciones` VARCHAR(191) NULL,

    UNIQUE INDEX `BarraDeOro_identificador_key`(`identificador`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActaFundicionF2` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroActa` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pesoTotalBruto` DOUBLE NOT NULL,
    `pesoTotalFino` DOUBLE NOT NULL,
    `observaciones` VARCHAR(191) NULL,
    `documentUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `ActaFundicionF2_numeroActa_key`(`numeroActa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActaFundicionF2BarraDeOro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaFundicionF2Id` INTEGER NOT NULL,
    `barraDeOroId` INTEGER NOT NULL,

    UNIQUE INDEX `ActaFundicionF2BarraDeOro_actaFundicionF2Id_barraDeOroId_key`(`actaFundicionF2Id`, `barraDeOroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BarraDeOro` ADD CONSTRAINT `BarraDeOro_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaFundicionF2BarraDeOro` ADD CONSTRAINT `ActaFundicionF2BarraDeOro_actaFundicionF2Id_fkey` FOREIGN KEY (`actaFundicionF2Id`) REFERENCES `ActaFundicionF2`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaFundicionF2BarraDeOro` ADD CONSTRAINT `ActaFundicionF2BarraDeOro_barraDeOroId_fkey` FOREIGN KEY (`barraDeOroId`) REFERENCES `BarraDeOro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
