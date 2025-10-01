/*
  Warnings:

  - You are about to drop the column `pesoBarra` on the `barrafundida` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `barrafundida` DROP COLUMN `pesoBarra`;

-- AlterTable
ALTER TABLE `historialmovimientosaldo` MODIFY `tipo` ENUM('COBRANZA_GENERADA', 'APLICACION_ARRIME', 'AJUSTE_MANUAL', 'COBRANZA_SALDADA', 'OTRO') NOT NULL;
