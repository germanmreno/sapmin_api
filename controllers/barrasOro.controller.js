const barrasOroService = require('../services/barrasOro.service');

/**
 * Listar barras de oro con filtros
 */
exports.listarBarras = async (req, res) => {
  try {
    const { mostrarRefundidas = 'false' } = req.query;
    const barras = await barrasOroService.listarBarras(
      mostrarRefundidas === 'true'
    );
    res.json(barras);
  } catch (error) {
    console.error('Error en listarBarras:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener detalles de una barra específica
 */
exports.obtenerDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const barra = await barrasOroService.obtenerDetalle(parseInt(id));

    if (!barra) {
      return res.status(404).json({ error: 'Barra no encontrada' });
    }

    res.json(barra);
  } catch (error) {
    console.error('Error en obtenerDetalle:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear nueva barra de oro
 */
exports.crearBarra = async (req, res) => {
  try {
    const datos = req.body;
    const barra = await barrasOroService.crearBarra(datos);
    res.status(201).json(barra);
  } catch (error) {
    console.error('Error en crearBarra:', error);
    res.status(500).json({ error: error.message });
  }
};
