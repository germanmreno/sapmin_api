const express = require('express');
const router = express.Router();
const barrasOroController = require('../controllers/barrasOro.controller');

// Listar barras de oro (con filtro de refundidas)
router.get('/', barrasOroController.listarBarras);

// Obtener detalles de una barra específica
router.get('/:id', barrasOroController.obtenerDetalle);

// Crear nueva barra de oro
router.post('/', barrasOroController.crearBarra);

module.exports = router;
