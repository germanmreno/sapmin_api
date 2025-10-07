-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: produccion_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actaarrime`
--

DROP TABLE IF EXISTS `actaarrime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actaarrime` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sectorId` int NOT NULL,
  `alianzaId` int NOT NULL,
  `funcionarioId` int NOT NULL,
  `representanteLegal` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rifAlianza` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomenclatura` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `piezas` int NOT NULL,
  `pesoBruto` double NOT NULL,
  `tipoLey` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pesoFino` double NOT NULL,
  `observaciones` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ActaArrime_nomenclatura_key` (`nomenclatura`),
  KEY `ActaArrime_alianzaId_fkey` (`alianzaId`),
  KEY `ActaArrime_funcionarioId_fkey` (`funcionarioId`),
  KEY `ActaArrime_sectorId_fkey` (`sectorId`),
  CONSTRAINT `ActaArrime_alianzaId_fkey` FOREIGN KEY (`alianzaId`) REFERENCES `alianza` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ActaArrime_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionario` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ActaArrime_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `sector` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actaarrime`
--

LOCK TABLES `actaarrime` WRITE;
/*!40000 ALTER TABLE `actaarrime` DISABLE KEYS */;
/*!40000 ALTER TABLE `actaarrime` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-07 14:19:06
