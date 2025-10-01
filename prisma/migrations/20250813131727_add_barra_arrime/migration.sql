-- CreateTable
CREATE TABLE `BarraArrime` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaArrimeId` INTEGER NOT NULL,
    `numeroBarra` INTEGER NOT NULL,
    `pesoBruto` DOUBLE NOT NULL,
    `promedioLey` DOUBLE NOT NULL,
    `pesoFino` DOUBLE NOT NULL,
    `precintoBarra` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BarraArrime` ADD CONSTRAINT `BarraArrime_actaArrimeId_fkey` FOREIGN KEY (`actaArrimeId`) REFERENCES `ActaArrime`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
