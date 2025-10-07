-- DropIndex
DROP INDEX `ActaArrimePequenaMineria_numeroActa_key` ON `actaarrimepequenamineria`;

-- AlterTable
ALTER TABLE `barradeoro` ADD COLUMN `actaArrimePequenaMineriaId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `ActaArrimePequenaMineria_numeroActa_fechaArrime_idx` ON `ActaArrimePequenaMineria`(`numeroActa`, `fechaArrime`);

-- AddForeignKey
ALTER TABLE `BarraDeOro` ADD CONSTRAINT `BarraDeOro_actaArrimePequenaMineriaId_fkey` FOREIGN KEY (`actaArrimePequenaMineriaId`) REFERENCES `ActaArrimePequenaMineria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
