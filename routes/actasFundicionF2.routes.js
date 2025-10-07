const express = require('express');
const router = express.Router();
const actasFundicionF2Controller = require('../controllers/actasFundicionF2.controller');

// Listar actas F2 con paginación y estadísticas
router.get('/', actasFundicionF2Controller.listarActas);

// Obtener detalles de un acta F2 específica
router.get('/:id', actasFundicionF2Controller.obtenerDetalle);

// Crear nueva acta F2
router.post('/', actasFundicionF2Controller.crearActa);

// Generar documento PDF de un acta F2
router.get('/:id/pdf', actasFundicionF2Controller.generarPDF);

module.exports = router;
