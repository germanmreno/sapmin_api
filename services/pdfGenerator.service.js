const PDFDocument = require('pdfkit');

/**
 * Generar PDF para Acta de Fundición F2
 */
exports.generarPDFActaF2 = async (actaData) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      // Buffer para almacenar el PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // === ENCABEZADO ===
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('CORPORACIÓN VENEZOLANA DE MINERÍA', { align: 'center' })
        .fontSize(16)
        .text('ACTA DE FUNDICIÓN F2 - REFUNDICIÓN', { align: 'center' })
        .moveDown(1);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

      // === INFORMACIÓN DEL ACTA ===
      const startY = doc.y;

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('INFORMACIÓN DEL ACTA', 50, startY)
        .moveDown(0.5);

      // Información en dos columnas
      const leftColumn = 50;
      const rightColumn = 300;
      let currentY = doc.y;

      // Columna izquierda
      doc
        .font('Helvetica-Bold')
        .text('Número de Acta:', leftColumn, currentY)
        .font('Helvetica')
        .text(actaData.numeroActa, leftColumn + 110, currentY);

      currentY += 20;
      doc
        .font('Helvetica-Bold')
        .text('Fecha del Acta:', leftColumn, currentY)
        .font('Helvetica')
        .text(actaData.fechaActaFormateada, leftColumn + 110, currentY);

      // Columna derecha
      currentY = doc.y;
      doc
        .font('Helvetica-Bold')
        .text('Fecha de Creación:', rightColumn, currentY)
        .font('Helvetica')
        .text(actaData.fechaCreacionFormateada, rightColumn + 110, currentY);

      currentY += 20;
      doc
        .font('Helvetica-Bold')
        .text('Cantidad de Piezas:', rightColumn, currentY)
        .font('Helvetica')
        .text(
          actaData.piezasFormateadas.length.toString(),
          rightColumn + 110,
          currentY
        );

      doc.y = Math.max(doc.y, currentY + 30);

      // === CÁLCULOS DE FUNDICIÓN ===
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('CÁLCULOS DE FUNDICIÓN')
        .moveDown(0.5);

      // Crear tabla de cálculos
      const tableY = doc.y;
      const tableHeaders = ['Concepto', 'Valor', 'Unidad'];
      const tableData = [
        ['Peso Total de Piezas', actaData.pesoTotalPiezas.toFixed(2), 'gramos'],
        ['Peso Final de Barra', actaData.pesoFinalBarra.toFixed(2), 'gramos'],
        ['Merma', actaData.merma.toFixed(2), 'gramos'],
        ['Porcentaje de Merma', actaData.porcentajeMerma.toFixed(2), '%'],
      ];

      // Dibujar tabla de cálculos
      drawTable(doc, tableHeaders, tableData, 50, tableY, [250, 150, 100]);

      doc.moveDown(2);

      // === PIEZAS UTILIZADAS ===
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PIEZAS DE ORO UTILIZADAS')
        .moveDown(0.5);

      // Headers de la tabla de piezas
      const piezasHeaders = [
        'Identificador',
        'Peso Bruto',
        'Ley',
        'Peso Fino',
        'Alianza',
      ];
      const piezasData = actaData.piezasFormateadas.map((pieza) => [
        pieza.identificador,
        `${pieza.pesoBruto.toFixed(2)}g`,
        pieza.tipoLey.toFixed(1),
        `${pieza.pesoFino.toFixed(2)}g`,
        pieza.alianzaInfo?.nombre || 'N/A',
      ]);

      // Dibujar tabla de piezas
      drawTable(
        doc,
        piezasHeaders,
        piezasData,
        50,
        doc.y,
        [150, 80, 50, 80, 135]
      );

      doc.moveDown(2);

      // === OBSERVACIONES ===
      if (actaData.observaciones && actaData.observaciones.trim()) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('OBSERVACIONES')
          .moveDown(0.5)
          .font('Helvetica')
          .text(actaData.observaciones, { align: 'justify' })
          .moveDown(1);
      }

      // === PIE DE PÁGINA ===
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 100;

      doc.y = Math.max(doc.y, footerY - 80);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(1);

      // Firmas
      const signatureY = doc.y;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('_________________________', 80, signatureY)
        .text('Responsable de Fundición', 80, signatureY + 20)
        .text('_________________________', 350, signatureY)
        .text('Supervisor', 350, signatureY + 20);

      // Información del sistema
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Generado el ${new Date().toLocaleString('es-VE')} por Sistema CVM`,
          50,
          pageHeight - 30,
          {
            align: 'center',
          }
        );

      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Función auxiliar para dibujar tablas
 */
function drawTable(doc, headers, data, x, y, columnWidths) {
  const rowHeight = 25;
  const headerHeight = 30;
  let currentY = y;

  // Dibujar headers
  let currentX = x;
  headers.forEach((header, i) => {
    // Fondo del header
    doc
      .rect(currentX, currentY, columnWidths[i], headerHeight)
      .fillAndStroke('#f0f0f0', '#000000');

    // Texto del header
    doc
      .fillColor('#000000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(header, currentX + 5, currentY + 8, {
        width: columnWidths[i] - 10,
        align: 'center',
      });

    currentX += columnWidths[i];
  });

  currentY += headerHeight;

  // Dibujar filas de datos
  data.forEach((row) => {
    currentX = x;
    row.forEach((cell, i) => {
      // Borde de la celda
      doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();

      // Texto de la celda
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(cell, currentX + 5, currentY + 8, {
          width: columnWidths[i] - 10,
          align: 'left',
        });

      currentX += columnWidths[i];
    });
    currentY += rowHeight;
  });

  doc.y = currentY;
}
