-- AlterTable
ALTER TABLE `historialmovimientosaldo` MODIFY `tipo` ENUM('COBRANZA_GENERADA', 'APLICACION_ARRIME', 'EXCEDENTE_ARRIME', 'APLICACION_SALDO_FAVOR', 'AJUSTE_MANUAL', 'COBRANZA_SALDADA', 'OTRO') NOT NULL;

-- CreateTable
CREATE TABLE `SaldoAFavor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alianzaId` INTEGER NOT NULL,
    `actaArrimeId` INTEGER NULL,
    `monto` DOUBLE NOT NULL,
    `montoDisponible` DOUBLE NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `estado` ENUM('DISPONIBLE', 'PARCIALMENTE_USADO', 'AGOTADO') NOT NULL DEFAULT 'DISPONIBLE',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaUso` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AplicacionSaldoAFavor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saldoAFavorId` INTEGER NOT NULL,
    `actaCobranzaId` INTEGER NOT NULL,
    `montoAplicado` DOUBLE NOT NULL,
    `fechaAplicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `descripcion` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SaldoAFavor` ADD CONSTRAINT `SaldoAFavor_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaldoAFavor` ADD CONSTRAINT `SaldoAFavor_actaArrimeId_fkey` FOREIGN KEY (`actaArrimeId`) REFERENCES `ActaArrime`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AplicacionSaldoAFavor` ADD CONSTRAINT `AplicacionSaldoAFavor_saldoAFavorId_fkey` FOREIGN KEY (`saldoAFavorId`) REFERENCES `SaldoAFavor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AplicacionSaldoAFavor` ADD CONSTRAINT `AplicacionSaldoAFavor_actaCobranzaId_fkey` FOREIGN KEY (`actaCobranzaId`) REFERENCES `ActaCobranza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
