-- Eliminar campo nombreActa de actafundicionf2
-- Ejecutar manualmente en MySQL

USE produccion_db;

-- Verificar que la columna existe
SHOW COLUMNS FROM actafundicionf2 LIKE 'nombreActa';

-- Eliminar la columna nombreActa
ALTER TABLE actafundicionf2 DROP COLUMN nombreActa;

-- Verificar que se eliminó correctamente
DESCRIBE actafundicionf2;
