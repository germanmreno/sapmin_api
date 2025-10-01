-- CreateTable
CREATE TABLE `ActaArrime` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectorId` INTEGER NOT NULL,
    `alianzaId` INTEGER NOT NULL,
    `funcionarioId` INTEGER NOT NULL,
    `representanteLegal` VARCHAR(191) NOT NULL,
    `rifAlianza` VARCHAR(191) NOT NULL,
    `nomenclatura` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `piezas` INTEGER NOT NULL,
    `pesoBruto` DOUBLE NOT NULL,
    `tipoLey` VARCHAR(191) NOT NULL,
    `pesoFino` DOUBLE NOT NULL,
    `observaciones` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ActaArrime_nomenclatura_key`(`nomenclatura`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleArrimeCobranza` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaArrimeId` INTEGER NOT NULL,
    `actaCobranzaId` INTEGER NOT NULL,
    `montoAplicado` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActaArrime` ADD CONSTRAINT `ActaArrime_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaArrime` ADD CONSTRAINT `ActaArrime_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaArrime` ADD CONSTRAINT `ActaArrime_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `Funcionario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleArrimeCobranza` ADD CONSTRAINT `DetalleArrimeCobranza_actaArrimeId_fkey` FOREIGN KEY (`actaArrimeId`) REFERENCES `ActaArrime`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleArrimeCobranza` ADD CONSTRAINT `DetalleArrimeCobranza_actaCobranzaId_fkey` FOREIGN KEY (`actaCobranzaId`) REFERENCES `ActaCobranza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
