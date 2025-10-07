/*
  Warnings:

  - You are about to drop the column `pesoTotalBruto` on the `actafundicionf2` table. All the data in the column will be lost.
  - You are about to drop the column `pesoTotalFino` on the `actafundicionf2` table. All the data in the column will be lost.
  - You are about to drop the `actafundicionf2barradeoro` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fechaActa` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `merma` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreActa` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pesoFinalBarra` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pesoTotalPiezas` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ActaFundicionF2` table without a default value. This is not possible if the table is not empty.

*/

-- PASO 1: Agregar nuevas columnas con valores temporales
ALTER TABLE `actafundicionf2` 
    ADD COLUMN `nombreActa` VARCHAR(191) NULL,
    ADD COLUMN `fechaActa` DATETIME(3) NULL,
    ADD COLUMN `pesoTotalPiezas` DOUBLE NULL,
    ADD COLUMN `pesoFinalBarra` DOUBLE NULL,
    ADD COLUMN `merma` DOUBLE NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- PASO 2: Migrar datos existentes
UPDATE `actafundicionf2` 
SET 
    `nombreActa` = CONCAT('Fundición ', `numeroActa`),
    `fechaActa` = `fechaCreacion`,
    `pesoTotalPiezas` = `pesoTotalBruto`,
    `pesoFinalBarra` = `pesoTotalBruto` * 0.98, -- Asumiendo 2% de merma
    `merma` = `pesoTotalBruto` * 0.02
WHERE `nombreActa` IS NULL;

-- PASO 3: Hacer las columnas NOT NULL ahora que tienen datos
ALTER TABLE `actafundicionf2` 
    MODIFY COLUMN `nombreActa` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `fechaActa` DATETIME(3) NOT NULL,
    MODIFY COLUMN `pesoTotalPiezas` DOUBLE NOT NULL,
    MODIFY COLUMN `pesoFinalBarra` DOUBLE NOT NULL,
    MODIFY COLUMN `merma` DOUBLE NOT NULL;

-- PASO 4: Agregar columna actaFundicionF2Id a BarraDeOro
ALTER TABLE `barradeoro` 
    ADD COLUMN `actaFundicionF2Id` INTEGER NULL,
    ADD COLUMN `precintoBarra` VARCHAR(191) NULL;

-- PASO 5: Migrar relaciones de la tabla intermedia
UPDATE `barradeoro` b
INNER JOIN `actafundicionf2barradeoro` rel ON b.id = rel.barraDeOroId
SET b.actaFundicionF2Id = rel.actaFundicionF2Id
WHERE b.actaFundicionF2Id IS NULL;

-- PASO 6: Drop foreign keys de la tabla intermedia
ALTER TABLE `actafundicionf2barradeoro` DROP FOREIGN KEY `ActaFundicionF2BarraDeOro_actaFundicionF2Id_fkey`;
ALTER TABLE `actafundicionf2barradeoro` DROP FOREIGN KEY `ActaFundicionF2BarraDeOro_barraDeOroId_fkey`;

-- PASO 7: Eliminar tabla intermedia
DROP TABLE `actafundicionf2barradeoro`;

-- PASO 8: Eliminar columnas antiguas
ALTER TABLE `actafundicionf2` 
    DROP COLUMN `pesoTotalBruto`,
    DROP COLUMN `pesoTotalFino`;

-- PASO 9: Crear índices
CREATE INDEX `ActaFundicionF2_fechaActa_idx` ON `ActaFundicionF2`(`fechaActa`);
CREATE INDEX `ActaFundicionF2_numeroActa_idx` ON `ActaFundicionF2`(`numeroActa`);
CREATE INDEX `BarraDeOro_refundida_idx` ON `BarraDeOro`(`refundida`);
CREATE INDEX `BarraDeOro_actaFundicionF2Id_idx` ON `BarraDeOro`(`actaFundicionF2Id`);

-- PASO 10: Agregar foreign key
ALTER TABLE `BarraDeOro` ADD CONSTRAINT `BarraDeOro_actaFundicionF2Id_fkey` 
    FOREIGN KEY (`actaFundicionF2Id`) REFERENCES `ActaFundicionF2`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- PASO 11: Renombrar índice
ALTER TABLE `barradeoro` RENAME INDEX `BarraDeOro_alianzaId_fkey` TO `BarraDeOro_alianzaId_idx`;
