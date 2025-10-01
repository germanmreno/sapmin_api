-- CreateTable
CREATE TABLE `Funcionario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `tipoCedula` ENUM('V', 'E') NOT NULL,
    `cedula` INTEGER NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `estatus` ENUM('ACTIVO', 'VACACIONES', 'REPOSO', 'PERMISO') NOT NULL,
    `sectorId` INTEGER NOT NULL,
    `alianzaId` INTEGER NOT NULL,

    UNIQUE INDEX `Funcionario_cedula_key`(`cedula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Funcionario` ADD CONSTRAINT `Funcionario_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Funcionario` ADD CONSTRAINT `Funcionario_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `Alianza`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
