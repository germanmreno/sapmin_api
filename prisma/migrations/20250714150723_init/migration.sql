-- CreateTable
CREATE TABLE `Sector` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Sector_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alianza` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `rif` VARCHAR(191) NOT NULL,
    `fechaConstitucion` DATETIME(3) NOT NULL,
    `representanteLegal` VARCHAR(191) NOT NULL,
    `estatus` ENUM('ACTIVA', 'INACTIVA') NOT NULL,
    `poseenMinas` BOOLEAN NOT NULL,
    `numeroLineas` INTEGER NOT NULL,
    `direccionPlanta` VARCHAR(191) NOT NULL,
    `correoEmpresa` VARCHAR(191) NOT NULL,
    `telefonoEmpresa` VARCHAR(191) NOT NULL,
    `capacidadInstalada` VARCHAR(191) NOT NULL,
    `capacidadOperativa` VARCHAR(191) NOT NULL,
    `sectorId` INTEGER NOT NULL,

    UNIQUE INDEX `Alianza_rif_key`(`rif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Alianza` ADD CONSTRAINT `Alianza_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
