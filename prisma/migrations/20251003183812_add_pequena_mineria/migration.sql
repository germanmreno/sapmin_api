-- AlterTable
ALTER TABLE `barradeoro` ADD COLUMN `alianzaPequenaMineriaId` INTEGER NULL;

-- CreateTable
CREATE TABLE `AlianzaPequenaMineria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rifCedula` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipoPersona` ENUM('NATURAL', 'JURIDICA') NOT NULL,
    `representanteLegal` VARCHAR(191) NULL,
    `sectorId` INTEGER NOT NULL,
    `estatus` ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AlianzaPequenaMineria_rifCedula_key`(`rifCedula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActaArrimePequenaMineria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroActa` VARCHAR(191) NOT NULL,
    `fechaArrime` DATETIME(3) NOT NULL,
    `montoPesoBruto` DOUBLE NOT NULL,
    `alianzaId` INTEGER NOT NULL,
    `sectorId` INTEGER NOT NULL,
    `observaciones` VARCHAR(191) NULL,
    `funcionarioId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ActaArrimePequenaMineria_numeroActa_key`(`numeroActa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BarraArrimePequenaMineria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actaArrimeId` INTEGER NOT NULL,
    `numeroBarra` INTEGER NOT NULL,
    `pesoBruto` DOUBLE NOT NULL,
    `pesoFino` DOUBLE NULL,
    `ley` DOUBLE NULL,
    `precintoBarra` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BarraDeOro` ADD CONSTRAINT `BarraDeOro_alianzaPequenaMineriaId_fkey` FOREIGN KEY (`alianzaPequenaMineriaId`) REFERENCES `AlianzaPequenaMineria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlianzaPequenaMineria` ADD CONSTRAINT `AlianzaPequenaMineria_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaArrimePequenaMineria` ADD CONSTRAINT `ActaArrimePequenaMineria_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `AlianzaPequenaMineria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaArrimePequenaMineria` ADD CONSTRAINT `ActaArrimePequenaMineria_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActaArrimePequenaMineria` ADD CONSTRAINT `ActaArrimePequenaMineria_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `Funcionario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BarraArrimePequenaMineria` ADD CONSTRAINT `BarraArrimePequenaMineria_actaArrimeId_fkey` FOREIGN KEY (`actaArrimeId`) REFERENCES `ActaArrimePequenaMineria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
