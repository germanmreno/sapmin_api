-- Actualizar el enum TipoMovimientoSaldo para incluir COBRANZA_GENERADA
-- Nota: Esta migración debe ejecutarse manualmente en MySQL

-- Primero, agregar el nuevo valor al enum
ALTER TABLE `HistorialMovimientoSaldo` 
MODIFY COLUMN `tipo` ENUM('COBRANZA_GENERADA', 'APLICACION_ARRIME', 'AJUSTE_MANUAL', 'COBRANZA_SALDADA', 'OTRO') NOT NULL;

-- Asegurar que todas las alianzas tengan saldoDeuda inicializado
UPDATE `Alianza` SET `saldoDeuda` = 0 WHERE `saldoDeuda` IS NULL;

-- Asegurar que todas las actas de cobranza tengan saldoActual inicializado
UPDATE `ActaCobranza` SET `saldoActual` = `totalCobranza` WHERE `saldoActual` = 0 AND `estado` = 'PENDIENTE';