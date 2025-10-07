-- ============================================
-- Migración: Simplificar Actas F2
-- Fecha: 07/10/2025
-- Descripción: Eliminar tabla intermedia y usar relación directa
-- ============================================

-- PASO 1: Backup (ejecutar antes de esta migración)
-- mysqldump -u usuario -p nombre_bd > backup_antes_migracion_f2.sql

-- PASO 2: Verificar datos existentes
SELECT 
    'ActaFundicionF2' as tabla,
    COUNT(*) as registros
FROM ActaFundicionF2
UNION ALL
SELECT 
    'BarraDeOro' as tabla,
    COUNT(*) as registros
FROM BarraDeOro
UNION ALL
SELECT 
    'ActaFundicionF2BarraDeOro' as tabla,
    COUNT(*) as registros
FROM ActaFundicionF2BarraDeOro;

-- PASO 3: Agregar columna actaFundicionF2Id a BarraDeOro (si no existe)
ALTER TABLE BarraDeOro 
ADD COLUMN IF NOT EXISTS actaFundicionF2Id INT NULL AFTER refundida;

-- PASO 4: Migrar datos de la tabla intermedia a BarraDeOro
UPDATE BarraDeOro b
INNER JOIN ActaFundicionF2BarraDeOro rel ON b.id = rel.barraDeOroId
SET b.actaFundicionF2Id = rel.actaFundicionF2Id
WHERE b.actaFundicionF2Id IS NULL;

-- PASO 5: Verificar migración de datos
SELECT 
    'Barras con acta F2 asignada' as descripcion,
    COUNT(*) as cantidad
FROM BarraDeOro
WHERE actaFundicionF2Id IS NOT NULL;

-- PASO 6: Agregar foreign key
ALTER TABLE BarraDeOro
ADD CONSTRAINT fk_barra_acta_f2
FOREIGN KEY (actaFundicionF2Id) REFERENCES ActaFundicionF2(id)
ON DELETE SET NULL;

-- PASO 7: Agregar índices para performance
CREATE INDEX IF NOT EXISTS idx_barra_refundida ON BarraDeOro(refundida);
CREATE INDEX IF NOT EXISTS idx_barra_acta_f2 ON BarraDeOro(actaFundicionF2Id);

-- PASO 8: Eliminar tabla intermedia (solo después de verificar que todo funciona)
-- DROP TABLE IF EXISTS ActaFundicionF2BarraDeOro;

-- PASO 9: Verificación final
SELECT 
    a.id,
    a.numeroActa,
    a.nombreActa,
    COUNT(b.id) as cantidad_piezas,
    SUM(b.pesoBruto) as peso_total
FROM ActaFundicionF2 a
LEFT JOIN BarraDeOro b ON b.actaFundicionF2Id = a.id
GROUP BY a.id, a.numeroActa, a.nombreActa
ORDER BY a.fechaCreacion DESC
LIMIT 10;

-- ============================================
-- Notas:
-- 1. Ejecutar PASO 8 solo después de verificar que todo funciona
-- 2. Mantener backup hasta confirmar que la migración es exitosa
-- 3. Probar en desarrollo antes de aplicar en producción
-- ============================================
