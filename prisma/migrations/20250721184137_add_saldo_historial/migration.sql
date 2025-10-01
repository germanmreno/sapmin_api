/*
  Warnings:

  - A unique constraint covering the columns `[actaArrimeId,actaCobranzaId]` on the table `DetalleArrimeCobranza` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `actacobranza` ADD COLUMN `saldoActual` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `alianza` ADD COLUMN `saldoDeuda` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `HistorialMovimientoSaldo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alianzaId` INTEGER NULL,
    `actaCobranzaId` INTEGER NULL,
    `tipo` ENUM('APLICACION_ARRIME', 'AJUSTE_MANUAL', 'COBRANZA_SALDADA', 'OTRO') NOT NULL,
    `monto` DOUBLE NOT NULL,
    `saldoAntes` DOUBLE NOT NULL,
    `saldoDespues` DOUBLE NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `DetalleArrimeCobranza_actaArrimeId_actaCobranzaId_key` ON `DetalleArrimeCobranza`(`actaArrimeId`, `actaCobranzaId`);

-- AddForeignKey
ALTER TABLE `HistorialMovimientoSaldo` ADD CONSTRAINT `HistorialMovimientoSaldo_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialMovimientoSaldo` ADD CONSTRAINT `HistorialMovimientoSaldo_actaCobranzaId_fkey` FOREIGN KEY (`actaCobranzaId`) REFERENCES `ActaCobranza`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
