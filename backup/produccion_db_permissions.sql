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
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_permission_name_module_name_key` (`permission_name`,`module_name`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'view','DASHBOARD','Permiso view para módulo DASHBOARD','2025-10-07 16:15:50.980'),(2,'export','DASHBOARD','Permiso export para módulo DASHBOARD','2025-10-07 16:15:50.995'),(3,'create','USERS','Permiso create para módulo USERS','2025-10-07 16:15:51.002'),(4,'read','USERS','Permiso read para módulo USERS','2025-10-07 16:15:51.008'),(5,'update','USERS','Permiso update para módulo USERS','2025-10-07 16:15:51.013'),(6,'delete','USERS','Permiso delete para módulo USERS','2025-10-07 16:15:51.019'),(7,'create','ALIANZAS','Permiso create para módulo ALIANZAS','2025-10-07 16:15:51.025'),(8,'read','ALIANZAS','Permiso read para módulo ALIANZAS','2025-10-07 16:15:51.030'),(9,'update','ALIANZAS','Permiso update para módulo ALIANZAS','2025-10-07 16:15:51.035'),(10,'delete','ALIANZAS','Permiso delete para módulo ALIANZAS','2025-10-07 16:15:51.041'),(11,'create','ACTAS_ARRIME','Permiso create para módulo ACTAS_ARRIME','2025-10-07 16:15:51.046'),(12,'read','ACTAS_ARRIME','Permiso read para módulo ACTAS_ARRIME','2025-10-07 16:15:51.052'),(13,'update','ACTAS_ARRIME','Permiso update para módulo ACTAS_ARRIME','2025-10-07 16:15:51.058'),(14,'delete','ACTAS_ARRIME','Permiso delete para módulo ACTAS_ARRIME','2025-10-07 16:15:51.064'),(15,'bulk_upload','ACTAS_ARRIME','Permiso bulk_upload para módulo ACTAS_ARRIME','2025-10-07 16:15:51.070'),(16,'create','FUNDICION_F2','Permiso create para módulo FUNDICION_F2','2025-10-07 16:15:51.075'),(17,'read','FUNDICION_F2','Permiso read para módulo FUNDICION_F2','2025-10-07 16:15:51.080'),(18,'update','FUNDICION_F2','Permiso update para módulo FUNDICION_F2','2025-10-07 16:15:51.085'),(19,'delete','FUNDICION_F2','Permiso delete para módulo FUNDICION_F2','2025-10-07 16:15:51.090'),(20,'create','BARRAS_ORO','Permiso create para módulo BARRAS_ORO','2025-10-07 16:15:51.096'),(21,'read','BARRAS_ORO','Permiso read para módulo BARRAS_ORO','2025-10-07 16:15:51.101'),(22,'update','BARRAS_ORO','Permiso update para módulo BARRAS_ORO','2025-10-07 16:15:51.106'),(23,'delete','BARRAS_ORO','Permiso delete para módulo BARRAS_ORO','2025-10-07 16:15:51.112'),(24,'create','COBRANZAS','Permiso create para módulo COBRANZAS','2025-10-07 16:15:51.117'),(25,'read','COBRANZAS','Permiso read para módulo COBRANZAS','2025-10-07 16:15:51.123'),(26,'update','COBRANZAS','Permiso update para módulo COBRANZAS','2025-10-07 16:15:51.129'),(27,'delete','COBRANZAS','Permiso delete para módulo COBRANZAS','2025-10-07 16:15:51.134'),(28,'read','SETTINGS','Permiso read para módulo SETTINGS','2025-10-07 16:15:51.140'),(29,'update','SETTINGS','Permiso update para módulo SETTINGS','2025-10-07 16:15:51.149'),(30,'view','REPORTS','Permiso view para módulo REPORTS','2025-10-07 16:15:51.161'),(31,'export','REPORTS','Permiso export para módulo REPORTS','2025-10-07 16:15:51.170'),(32,'advanced','REPORTS','Permiso advanced para módulo REPORTS','2025-10-07 16:15:51.178');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-07 14:19:07
