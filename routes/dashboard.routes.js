const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Estadísticas generales
router.get('/estadisticas', dashboardController.getEstadisticasGenerales);

// Estadísticas por mes
router.get('/estadisticas-mes', dashboardController.getEstadisticasPorMes);

// Top alianzas
router.get('/top-alianzas', dashboardController.getTopAlianzas);

module.exports = router;
