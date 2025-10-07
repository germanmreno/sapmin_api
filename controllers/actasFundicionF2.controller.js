const actasFundicionF2Service = require('../services/actasFundicionF2.service');
const pdfGeneratorService = require('../services/pdfGenerator.service');

/**
 * Listar actas F2 con paginación y estadísticas
 */
exports.listarActas = async (req, res) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const resultado = await actasFundicionF2Service.listarActas(
      pageNum,
      limitNum
    );
    res.json(resultado);
  } catch (error) {
    console.error('Error en listarActas:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener detalles de un acta F2 específica
 */
exports.obtenerDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const acta = await actasFundicionF2Service.obtenerDetalle(parseInt(id));

    if (!acta) {
      return res.status(404).json({ error: 'Acta F2 no encontrada' });
    }

    res.json(acta);
  } catch (error) {
    console.error('Error en obtenerDetalle:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crear nueva acta F2
 */
exports.crearActa = async (req, res) => {
  try {
    const {
      numeroActa,
      fechaActa,
      barrasSeleccionadas,
      pesoFinalBarra,
      observaciones,
    } = req.body;

    // Validaciones
    if (!numeroActa || !numeroActa.trim()) {
      return res.status(400).json({ error: 'El número de acta es requerido' });
    }

    if (!fechaActa) {
      return res.status(400).json({ error: 'La fecha del acta es requerida' });
    }

    if (!barrasSeleccionadas || barrasSeleccionadas.length === 0) {
      return res
        .status(400)
        .json({ error: 'Debe seleccionar al menos una barra' });
    }

    if (!pesoFinalBarra || pesoFinalBarra <= 0) {
      return res
        .status(400)
        .json({ error: 'El peso final debe ser mayor a 0' });
    }

    const resultado = await actasFundicionF2Service.crearActa({
      numeroActa,
      fechaActa,
      barrasSeleccionadas,
      pesoFinalBarra,
      observaciones,
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error en crearActa:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generar documento PDF de un acta F2
 */
exports.generarPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del acta
    const acta = await actasFundicionF2Service.obtenerDetalle(parseInt(id));

    if (!acta) {
      return res.status(404).json({ error: 'Acta F2 no encontrada' });
    }

    // Generar PDF
    const pdfBuffer = await pdfGeneratorService.generarPDFActaF2(acta);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Acta-F2-${acta.numeroActa}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Enviar PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error en generarPDF:', error);
    res.status(500).json({ error: error.message });
  }
};
