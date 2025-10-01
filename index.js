const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const app = express();
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

app.use(cors());
app.use(express.json());

// Listar sectores
app.get('/sectores', async (req, res) => {
  const sectores = await prisma.sector.findMany();
  res.json(sectores);
});

// Listar funcionarios
app.get('/funcionarios', async (req, res) => {
  const funcionarios = await prisma.funcionario.findMany({
    include: { sector: true, alianza: true },
  });
  res.json(funcionarios);
});

// Crear funcionario
app.post('/funcionarios', async (req, res) => {
  try {
    const data = req.body;
    const funcionario = await prisma.funcionario.create({
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipoCedula: data.tipoCedula,
        cedula: Number(data.cedula),
        correo: data.correo,
        telefono: data.telefono,
        estatus: data.estatus,
        sector: { connect: { id: Number(data.sectorId) } },
        alianza: { connect: { id: Number(data.alianzaId) } },
      },
      include: { sector: true, alianza: true },
    });
    res.status(201).json(funcionario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar alianzas
app.get('/alianzas', async (req, res) => {
  const { sectorId } = req.query;
  let where = {};
  if (sectorId) {
    where = { sectorId: Number(sectorId) };
  }
  const alianzas = await prisma.alianza.findMany({
    where,
    include: {
      sector: true,
      actasFundicion: {
        include: {
          actasCobranza: {
            where: {
              estado: 'PENDIENTE',
            },
          },
        },
      },
      actasArrime: true,
      saldosAFavor: {
        where: {
          estado: { in: ['DISPONIBLE', 'PARCIALMENTE_USADO'] },
          montoDisponible: { gt: 0 },
        },
      },
      movimientosSaldo: {
        orderBy: { fecha: 'desc' },
        take: 10,
        include: {
          actaCobranza: {
            select: {
              correlativo: true,
            },
          },
        },
      },
    },
  });

  // Calcular estadísticas adicionales para cada alianza
  const alianzasConEstadisticas = alianzas.map((alianza) => {
    const totalActasFundicion = alianza.actasFundicion.length;
    const cobranzasPendientes = alianza.actasFundicion.reduce(
      (total, acta) => total + acta.actasCobranza.length,
      0
    );
    const totalArrimes = alianza.actasArrime.length;
    const totalArrimado = alianza.actasArrime.reduce(
      (total, arrime) => total + arrime.pesoBruto,
      0
    );
    const totalSaldosAFavor = alianza.saldosAFavor.reduce(
      (total, saldo) => total + saldo.montoDisponible,
      0
    );

    return {
      ...alianza,
      totalSaldosAFavor,
      estadisticas: {
        totalActasFundicion,
        cobranzasPendientes,
        totalArrimes,
        totalArrimado,
        totalSaldosAFavor,
      },
    };
  });

  res.json(alianzasConEstadisticas);
});

// Obtener saldo de una alianza específica
app.get('/alianzas/:id/saldo', async (req, res) => {
  try {
    const { id } = req.params;
    const alianza = await prisma.alianza.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nombre: true,
        rif: true,
        saldoDeuda: true,
        actasFundicion: {
          include: {
            actasCobranza: {
              where: {
                estado: 'PENDIENTE',
                saldoActual: { gt: 0 },
              },
              include: {
                actaFundicion: {
                  select: {
                    numeroActa: true,
                  },
                },
              },
            },
          },
        },
        saldosAFavor: {
          where: {
            estado: { in: ['DISPONIBLE', 'PARCIALMENTE_USADO'] },
            montoDisponible: { gt: 0 },
          },
        },
        movimientosSaldo: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
    });

    if (!alianza) {
      return res.status(404).json({ error: 'Alianza no encontrada' });
    }

    // Aplanar las cobranzas pendientes para facilitar el uso en el frontend
    const cobranzasPendientes = [];
    for (const actaFundicion of alianza.actasFundicion) {
      for (const cobranza of actaFundicion.actasCobranza) {
        cobranzasPendientes.push({
          ...cobranza,
          actaFundicion: {
            id: actaFundicion.id,
            numeroActa: actaFundicion.numeroActa,
            fechaFundicion: actaFundicion.fechaFundicion,
          },
        });
      }
    }

    // Calcular total de saldos a favor disponibles
    const totalSaldosAFavor = alianza.saldosAFavor.reduce(
      (sum, saldo) => sum + saldo.montoDisponible,
      0
    );

    // Preparar respuesta con estructura más amigable
    const response = {
      id: alianza.id,
      nombre: alianza.nombre,
      rif: alianza.rif,
      saldoDeuda: alianza.saldoDeuda,
      totalSaldosAFavor,
      actasCobranza: cobranzasPendientes,
      saldosAFavor: alianza.saldosAFavor,
      movimientosSaldo: alianza.movimientosSaldo,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear alianza
app.post('/alianzas', async (req, res) => {
  try {
    const data = req.body;
    const alianza = await prisma.alianza.create({
      data: {
        nombre: data.nombre,
        rif: data.rif,
        fechaConstitucion: new Date(data.fechaConstitucion),
        representanteLegal: data.representanteLegal,
        estatus: data.estatus,
        poseenMinas: data.poseenMinas,
        numeroLineas: Number(data.numeroLineas),
        direccionPlanta: data.direccionPlanta,
        correoEmpresa: data.correoEmpresa,
        telefonoEmpresa: data.telefonoEmpresa,
        capacidadInstalada: data.capacidadInstalada,
        capacidadOperativa: data.capacidadOperativa,
        saldoDeuda: data.saldoDeuda || 0,
        sector: { connect: { id: Number(data.sectorId) } },
      },
      include: { sector: true },
    });
    res.status(201).json(alianza);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar alianza
app.put('/alianzas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const alianza = await prisma.alianza.update({
      where: { id: Number(id) },
      data: {
        nombre: data.nombre,
        rif: data.rif,
        fechaConstitucion: new Date(data.fechaConstitucion),
        representanteLegal: data.representanteLegal,
        estatus: data.estatus,
        poseenMinas: data.poseenMinas,
        numeroLineas: Number(data.numeroLineas),
        direccionPlanta: data.direccionPlanta,
        correoEmpresa: data.correoEmpresa,
        telefonoEmpresa: data.telefonoEmpresa,
        capacidadInstalada: data.capacidadInstalada,
        capacidadOperativa: data.capacidadOperativa,
        sectorId: Number(data.sectorId),
      },
      include: {
        sector: true,
        actasFundicion: {
          include: {
            actasCobranza: {
              where: {
                estado: 'PENDIENTE',
              },
            },
          },
        },
        actasArrime: true,
      },
    });

    // Calcular estadísticas
    const totalActasFundicion = alianza.actasFundicion.length;
    const cobranzasPendientes = alianza.actasFundicion.reduce(
      (total, acta) => total + acta.actasCobranza.length,
      0
    );
    const totalArrimes = alianza.actasArrime.length;
    const totalArrimado = alianza.actasArrime.reduce(
      (total, arrime) => total + arrime.pesoBruto,
      0
    );

    const alianzaConEstadisticas = {
      ...alianza,
      estadisticas: {
        totalActasFundicion,
        cobranzasPendientes,
        totalArrimes,
        totalArrimado,
      },
    };

    res.json(alianzaConEstadisticas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar actas de fundición (incluir cobranza)
app.get('/actas-fundicion', async (req, res) => {
  const actas = await prisma.actaFundicion.findMany({
    include: {
      sector: true,
      alianza: true,
      barras: true,
      actasCobranza: true,
    },
    orderBy: { fechaFundicion: 'desc' },
  });
  res.json(actas);
});

// Crear acta de fundición
app.post('/actas-fundicion', async (req, res) => {
  try {
    const data = req.body;

    // Usar transacción para crear el acta de fundición Y generar cobranza automáticamente
    const result = await prisma.$transaction(async (tx) => {
      // Crear el acta de fundición
      const nuevaActa = await tx.actaFundicion.create({
        data: {
          sector: { connect: { id: Number(data.sectorId) } },
          alianza: { connect: { id: Number(data.alianzaId) } },
          rifAlianza: data.rifAlianza,
          fechaFundicion: new Date(data.fechaFundicion),
          numeroActa: data.numeroActa,
          barras: {
            create: data.barras.map((b) => ({
              numeroBarra: Number(b.numeroBarra),
              precintoBarra: b.precintoBarra || '',
              totalBruto: Number(b.pesoBruto),
              promedioLey: Number(b.promedioLey),
              totalFino: Number(b.pesoFino),
            })),
          },
        },
        include: {
          sector: true,
          alianza: true,
          barras: true,
        },
      });

      // GENERAR COBRANZA AUTOMÁTICAMENTE
      // Calcular total bruto y total cobranza (usar peso bruto, no peso fino)
      const totalBruto = nuevaActa.barras.reduce(
        (sum, b) => sum + b.totalBruto,
        0
      );
      const porcentajeCobranza = 0.35; // 35% del peso bruto total
      const totalCobranza = +(totalBruto * porcentajeCobranza).toFixed(2);

      // Correlativo: tomar la parte final del correlativo del acta de fundición
      const partes = nuevaActa.numeroActa.split('/');
      const correlativoFinal = partes.slice(2).join('/');
      const correlativo = `CVM/GGP/GPM/${correlativoFinal}`;

      // Crear el acta de cobranza
      const actaCobranza = await tx.actaCobranza.create({
        data: {
          actaFundicion: { connect: { id: nuevaActa.id } },
          correlativo,
          hora: new Date(),
          totalCobranza,
          saldoActual: totalCobranza, // Inicialmente el saldo es igual al total
          estado: 'PENDIENTE',
        },
      });

      // Obtener saldo actual de la alianza
      const alianzaActual = await tx.alianza.findUnique({
        where: { id: nuevaActa.alianzaId },
        select: { saldoDeuda: true },
      });

      // Actualizar saldo de deuda de la alianza
      const nuevoSaldoAlianza = alianzaActual.saldoDeuda + totalCobranza;
      await tx.alianza.update({
        where: { id: nuevaActa.alianzaId },
        data: { saldoDeuda: nuevoSaldoAlianza },
      });

      // Registrar movimiento en historial
      await tx.historialMovimientoSaldo.create({
        data: {
          alianza: { connect: { id: nuevaActa.alianzaId } },
          actaCobranza: { connect: { id: actaCobranza.id } },
          tipo: 'COBRANZA_GENERADA',
          monto: totalCobranza,
          saldoAntes: alianzaActual.saldoDeuda,
          saldoDespues: nuevoSaldoAlianza,
          descripcion: `Cobranza generada automáticamente del acta de fundición ${nuevaActa.numeroActa}`,
        },
      });

      return { acta: nuevaActa, cobranza: actaCobranza };
    });

    res.status(201).json({
      ...result.acta,
      actasCobranza: [result.cobranza], // Incluir la cobranza generada en la respuesta
    });
  } catch (error) {
    console.error('Error creando acta de fundición:', error);
    res.status(400).json({ error: error.message });
  }
});

// Listar actas de cobranza
app.get('/actas-cobranza', async (req, res) => {
  try {
    const actasCobranza = await prisma.actaCobranza.findMany({
      include: {
        actaFundicion: {
          include: {
            alianza: true,
            sector: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(actasCobranza);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear acta de cobranza y generar documento Word
app.post('/actas-cobranza', async (req, res) => {
  try {
    const { actaFundicionId } = req.body;
    if (!actaFundicionId)
      return res.status(400).json({ error: 'Falta actaFundicionId' });

    // Usar transacción para operaciones atómicas
    const result = await prisma.$transaction(async (tx) => {
      // Buscar el acta de fundición y sus relaciones
      const acta = await tx.actaFundicion.findUnique({
        where: { id: Number(actaFundicionId) },
        include: {
          sector: true,
          alianza: true,
          barras: true,
        },
      });
      if (!acta) throw new Error('Acta de fundición no encontrada');

      // Verificar si ya existe cobranza
      const cobranzaExistente = await tx.actaCobranza.findFirst({
        where: { actaFundicionId: acta.id },
      });
      if (cobranzaExistente) {
        return {
          message: 'Ya existe un acta de cobranza para esta acta de fundición',
          cobranza: cobranzaExistente,
          downloadUrl: cobranzaExistente.documentUrl
            ? `/actas-cobranza/download/${cobranzaExistente.id}`
            : null,
        };
      }

      // Calcular total bruto y total cobranza (usar peso bruto, no peso fino)
      const totalBruto = acta.barras.reduce((sum, b) => sum + b.totalBruto, 0);
      const porcentajeCobranza = 0.35; // 35% del peso bruto total
      const totalCobranza = +(totalBruto * porcentajeCobranza).toFixed(2);

      // Correlativo: tomar la parte final del correlativo del acta de fundición
      const partes = acta.numeroActa.split('/');
      const correlativoFinal = partes.slice(2).join('/');
      const correlativo = `CVM/GGP/GPM/${correlativoFinal}`;

      // Crear el acta de cobranza
      const actaCobranza = await tx.actaCobranza.create({
        data: {
          actaFundicion: { connect: { id: acta.id } },
          correlativo,
          hora: new Date(),
          totalCobranza,
          saldoActual: totalCobranza, // Inicialmente el saldo es igual al total
          estado: 'PENDIENTE',
        },
      });

      // Obtener saldo actual de la alianza
      const alianzaActual = await tx.alianza.findUnique({
        where: { id: acta.alianzaId },
        select: { saldoDeuda: true },
      });

      // Actualizar saldo de deuda de la alianza
      const nuevoSaldoAlianza = alianzaActual.saldoDeuda + totalCobranza;
      await tx.alianza.update({
        where: { id: acta.alianzaId },
        data: { saldoDeuda: nuevoSaldoAlianza },
      });

      // Registrar movimiento en historial
      await tx.historialMovimientoSaldo.create({
        data: {
          alianza: { connect: { id: acta.alianzaId } },
          actaCobranza: { connect: { id: actaCobranza.id } },
          tipo: 'COBRANZA_GENERADA',
          monto: totalCobranza,
          saldoAntes: alianzaActual.saldoDeuda,
          saldoDespues: nuevoSaldoAlianza,
          descripcion: `Cobranza generada del acta de fundición ${acta.numeroActa}`,
        },
      });

      return { acta, actaCobranza, totalBruto, correlativo };
    });

    // Si ya existía la cobranza, retornar la respuesta
    if (result.message) {
      return res.status(200).json(result);
    }

    // Generar el documento Word fuera de la transacción
    const { acta, actaCobranza, totalBruto, correlativo } = result;

    // Crear directorio si no existe
    const dirPath = path.join(__dirname, 'generated', 'actas-cobranza');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const templatePath = path.join(
      __dirname,
      'utils',
      'acta',
      'actacobranza.docx'
    );

    // Verificar que el template existe
    if (!fs.existsSync(templatePath)) {
      console.warn(
        'Template de acta de cobranza no encontrado, continuando sin generar documento'
      );
    } else {
      try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Variables para el documento
        doc.render({
          correlativo,
          hora: actaCobranza.hora.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          totalCobranza: actaCobranza.totalCobranza,
          totalBruto,
          nombreAlianza: acta.alianza.nombre,
          rifAlianza: acta.rifAlianza,
          numeroActa: acta.numeroActa,
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        const fileName = `acta_cobranza_${acta.id}.docx`;
        const filePath = path.join('generated', 'actas-cobranza', fileName);
        const absPath = path.join(__dirname, filePath);
        fs.writeFileSync(absPath, buf);

        // Actualizar la URL del documento en la base de datos
        await prisma.actaCobranza.update({
          where: { id: actaCobranza.id },
          data: { documentUrl: `/${filePath.replace(/\\/g, '/')}` },
        });

        actaCobranza.documentUrl = `/${filePath.replace(/\\/g, '/')}`;
      } catch (docError) {
        console.error('Error generando documento:', docError);
        // Continuar sin documento
      }
    }

    res.status(201).json({
      cobranza: actaCobranza,
      downloadUrl: actaCobranza.documentUrl
        ? `/actas-cobranza/download/${actaCobranza.id}`
        : null,
    });
  } catch (error) {
    console.error('Error creando acta de cobranza:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para descargar el documento generado
app.get('/actas-cobranza/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cobranza = await prisma.actaCobranza.findUnique({
      where: { id: Number(id) },
    });
    if (!cobranza || !cobranza.documentUrl)
      return res.status(404).json({ error: 'Documento no encontrado' });
    const absPath = path.join(__dirname, cobranza.documentUrl);
    if (!fs.existsSync(absPath))
      return res
        .status(404)
        .json({ error: 'Archivo no existe en el servidor' });
    res.download(absPath, `acta_cobranza_${id}.docx`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar documento Word para acta de cobranza existente
app.post('/actas-cobranza/:id/generar-documento', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el acta de cobranza con todas sus relaciones
    const actaCobranza = await prisma.actaCobranza.findUnique({
      where: { id: Number(id) },
      include: {
        actaFundicion: {
          include: {
            alianza: true,
            sector: true,
            barras: true,
          },
        },
        detallesArrime: {
          include: {
            actaArrime: {
              select: {
                nomenclatura: true,
                pesoBruto: true,
              },
            },
          },
        },
      },
    });

    if (!actaCobranza) {
      return res.status(404).json({ error: 'Acta de cobranza no encontrada' });
    }

    const templatePath = path.join(
      __dirname,
      'utils',
      'acta',
      'actacobranza.docx'
    );

    // Verificar que el template existe
    if (!fs.existsSync(templatePath)) {
      return res
        .status(500)
        .json({ error: 'Template de documento no encontrado' });
    }

    try {
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Calcular totales de las barras
      const totalBruto = actaCobranza.actaFundicion.barras.reduce(
        (sum, b) => sum + b.totalBruto,
        0
      );
      const totalFino = actaCobranza.actaFundicion.barras.reduce(
        (sum, b) => sum + b.totalFino,
        0
      );

      // Preparar datos de pagos realizados
      const pagosRealizados = actaCobranza.detallesArrime.map((detalle) => ({
        nomenclatura: detalle.actaArrime.nomenclatura,
        montoPagado: detalle.montoAplicado.toFixed(2),
        totalArrime: detalle.actaArrime.pesoBruto.toFixed(2),
      }));

      // Preparar datos de las barras
      const barras = actaCobranza.actaFundicion.barras.map((barra) => ({
        numero: barra.numeroBarra,
        precinto: barra.precintoBarra,
        pesoBruto: barra.totalBruto.toFixed(2),
        ley: barra.promedioLey.toFixed(2),
        pesoFino: barra.totalFino.toFixed(2),
      }));

      // Variables para el documento usando docxtemplater
      const datosDocumento = {
        correlativo: actaCobranza.correlativo,
        fechaGeneracion: new Date(actaCobranza.createdAt).toLocaleDateString(
          'es-VE'
        ),
        horaGeneracion: new Date(actaCobranza.createdAt).toLocaleTimeString(
          'es-VE',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),

        // Información de la alianza
        nombreAlianza: actaCobranza.actaFundicion.alianza.nombre,
        rifAlianza: actaCobranza.actaFundicion.alianza.rif,
        representanteLegal:
          actaCobranza.actaFundicion.alianza.representanteLegal,
        direccionPlanta: actaCobranza.actaFundicion.alianza.direccionPlanta,

        // Información del sector
        nombreSector: actaCobranza.actaFundicion.sector.nombre,

        // Información del acta de fundición
        numeroActaFundicion: actaCobranza.actaFundicion.numeroActa,
        fechaFundicion: new Date(
          actaCobranza.actaFundicion.fechaFundicion
        ).toLocaleDateString('es-VE'),

        // Información financiera
        totalCobranza: actaCobranza.totalCobranza.toFixed(2),
        saldoActual: actaCobranza.saldoActual.toFixed(2),
        montoPagado: (
          actaCobranza.totalCobranza - actaCobranza.saldoActual
        ).toFixed(2),
        porcentajePagado: (
          ((actaCobranza.totalCobranza - actaCobranza.saldoActual) /
            actaCobranza.totalCobranza) *
          100
        ).toFixed(1),

        // Estado
        estado: actaCobranza.estado,
        estadoDescripcion:
          actaCobranza.estado === 'PENDIENTE'
            ? 'Pendiente de pago'
            : 'Saldada completamente',

        // Información de las barras
        barras: barras,
        totalBruto: totalBruto.toFixed(2),
        totalFino: totalFino.toFixed(2),

        // Información de pagos
        tienePagos: pagosRealizados.length > 0,
        pagos: pagosRealizados,

        // Fecha actual para el documento
        fechaDocumento: new Date().toLocaleDateString('es-VE'),
        horaDocumento: new Date().toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Renderizar el documento con docxtemplater
      doc.render(datosDocumento);

      const buf = doc.getZip().generate({ type: 'nodebuffer' });

      // Configurar headers para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="acta_cobranza_${actaCobranza.correlativo.replace(
          /\//g,
          '_'
        )}.docx"`
      );
      res.setHeader('Content-Length', buf.length);

      res.send(buf);
    } catch (docError) {
      console.error('Error generando documento:', docError);
      res.status(500).json({
        error: 'Error al generar el documento Word: ' + docError.message,
      });
    }
  } catch (error) {
    console.error('Error en endpoint generar-documento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener pagos realizados a una cobranza específica
app.get('/actas-cobranza/:id/pagos', async (req, res) => {
  try {
    const { id } = req.params;

    const pagos = await prisma.detalleArrimeCobranza.findMany({
      where: {
        actaCobranzaId: Number(id),
      },
      include: {
        actaArrime: {
          select: {
            nomenclatura: true,
            fecha: true,
            pesoBruto: true,
          },
        },
      },
      orderBy: {
        actaArrime: {
          fecha: 'desc',
        },
      },
    });

    const pagosFormateados = pagos.map((pago) => ({
      nomenclatura: pago.actaArrime.nomenclatura,
      fecha: pago.actaArrime.fecha,
      montoAplicado: pago.montoAplicado,
      totalArrime: pago.actaArrime.pesoBruto,
    }));

    res.json(pagosFormateados);
  } catch (error) {
    console.error('Error obteniendo pagos de cobranza:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marcar cobranza como saldada
app.put('/actas-cobranza/:id/saldar', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // Buscar la cobranza actual
      const cobranza = await tx.actaCobranza.findUnique({
        where: { id: Number(id) },
        include: {
          actaFundicion: {
            include: { alianza: true },
          },
        },
      });

      if (!cobranza) {
        throw new Error('Cobranza no encontrada');
      }

      if (cobranza.estado === 'SALDADA') {
        throw new Error('La cobranza ya está saldada');
      }

      // Actualizar la cobranza
      const cobranzaActualizada = await tx.actaCobranza.update({
        where: { id: Number(id) },
        data: {
          estado: 'SALDADA',
          saldoActual: 0,
        },
      });

      // Obtener saldo actual de la alianza
      const alianza = await tx.alianza.findUnique({
        where: { id: cobranza.actaFundicion.alianzaId },
        select: { saldoDeuda: true },
      });

      // Actualizar saldo de la alianza
      const nuevoSaldoAlianza = Math.max(
        0,
        alianza.saldoDeuda - cobranza.saldoActual
      );
      await tx.alianza.update({
        where: { id: cobranza.actaFundicion.alianzaId },
        data: { saldoDeuda: nuevoSaldoAlianza },
      });

      // Registrar movimiento en historial
      await tx.historialMovimientoSaldo.create({
        data: {
          alianza: { connect: { id: cobranza.actaFundicion.alianzaId } },
          actaCobranza: { connect: { id: cobranza.id } },
          tipo: 'COBRANZA_SALDADA',
          monto: -cobranza.saldoActual,
          saldoAntes: alianza.saldoDeuda,
          saldoDespues: nuevoSaldoAlianza,
          descripcion: `Cobranza ${cobranza.correlativo} marcada como saldada`,
        },
      });

      return cobranzaActualizada;
    });

    res.json(result);
  } catch (error) {
    console.error('Error saldando cobranza:', error);
    res.status(400).json({ error: error.message });
  }
});

// === Elusiones ===

// Listar elusiones de una alianza por mes/año
app.get('/alianzas/:alianzaId/elusiones', async (req, res) => {
  const { alianzaId } = req.params;
  const { mes, anio } = req.query;
  let where = { alianzaId: Number(alianzaId) };
  if (mes && anio) {
    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 0, 23, 59, 59);
    where.fechaInicio = { gte: desde, lte: hasta };
  }
  const elusiones = await prisma.elusion.findMany({
    where,
    orderBy: { fechaInicio: 'asc' },
  });
  res.json(elusiones);
});

// Crear elusión
app.post('/alianzas/:alianzaId/elusiones', async (req, res) => {
  try {
    const { alianzaId } = req.params;
    const { numero, fechaInicio, fechaFundicionEstimada, numeroLinea } =
      req.body;
    // Solo permitir crear si la fecha de inicio es futura
    if (new Date(fechaInicio) <= new Date()) {
      return res
        .status(400)
        .json({ error: 'Solo se pueden crear elusiones con fecha futura' });
    }
    const elusion = await prisma.elusion.create({
      data: {
        numero,
        fechaInicio: new Date(fechaInicio),
        fechaFundicionEstimada: new Date(fechaFundicionEstimada),
        numeroLinea,
        alianza: { connect: { id: Number(alianzaId) } },
      },
    });
    res.status(201).json(elusion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Editar elusión
app.put('/elusiones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, fechaInicio, fechaFundicionEstimada, numeroLinea } =
      req.body;
    const elusion = await prisma.elusion.findUnique({
      where: { id: Number(id) },
    });
    if (!elusion)
      return res.status(404).json({ error: 'Elusión no encontrada' });
    // Solo permitir editar si la fecha de inicio es futura
    if (new Date(elusion.fechaInicio) <= new Date()) {
      return res.status(400).json({
        error: 'No se puede editar una elusión cuya fecha de inicio ya pasó',
      });
    }
    const updated = await prisma.elusion.update({
      where: { id: Number(id) },
      data: {
        numero,
        fechaInicio: new Date(fechaInicio),
        fechaFundicionEstimada: new Date(fechaFundicionEstimada),
        numeroLinea,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validar elusión
app.post('/elusiones/:id/validar', async (req, res) => {
  const { id } = req.params;
  const elusion = await prisma.elusion.findUnique({
    where: { id: Number(id) },
  });
  if (!elusion) return res.status(404).json({ error: 'No encontrada' });
  // Solo permitir validar si la fecha de inicio ya pasó
  if (new Date(elusion.fechaInicio) > new Date()) {
    return res
      .status(400)
      .json({ error: 'No se puede validar antes de la fecha de inicio' });
  }
  const updated = await prisma.elusion.update({
    where: { id: Number(id) },
    data: { validada: true },
  });
  res.json(updated);
});

// Listar todas las elusiones pendientes
app.get('/elusiones', async (req, res) => {
  const { pendientes } = req.query;
  let where = {};
  if (pendientes === '1') {
    where.validada = false;
  }
  const elusiones = await prisma.elusion.findMany({
    where,
    orderBy: { fechaInicio: 'asc' },
    include: { alianza: { include: { sector: true } } },
  });
  res.json(elusiones);
});

// === Servicios de Deuda ===

// Calcular impacto de un arrime antes de aplicarlo
app.post('/deudas/calcular-impacto-arrime', async (req, res) => {
  try {
    const { alianzaId, montoArrime } = req.body;

    // Obtener cobranzas pendientes
    const cobranzasPendientes = await prisma.actaCobranza.findMany({
      where: {
        actaFundicion: {
          alianzaId: Number(alianzaId),
        },
        estado: 'PENDIENTE',
        saldoActual: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        actaFundicion: true,
      },
    });

    // Calcular aplicación
    let montoRestante = Number(montoArrime);
    const aplicaciones = [];
    let totalAplicado = 0;

    for (const cobranza of cobranzasPendientes) {
      if (montoRestante <= 0) break;

      const montoAplicar = Math.min(montoRestante, cobranza.saldoActual);
      aplicaciones.push({
        cobranzaId: cobranza.id,
        correlativo: cobranza.correlativo,
        saldoActual: cobranza.saldoActual,
        montoAplicar,
        quedaSaldada: montoAplicar >= cobranza.saldoActual,
      });

      totalAplicado += montoAplicar;
      montoRestante -= montoAplicar;
    }

    const excedente = montoRestante;

    res.json({
      montoArrime: Number(montoArrime),
      totalAplicado,
      excedente,
      aplicaciones,
      cobranzasSaldadas: aplicaciones.filter((a) => a.quedaSaldada).length,
    });
  } catch (error) {
    console.error('Error calculando impacto de arrime:', error);
    res.status(500).json({ error: error.message });
  }
});

// Procesar arrime completo: aplicar a deudas y crear excedente
app.post('/deudas/procesar-arrime-completo', async (req, res) => {
  try {
    const { alianzaId, montoArrime, actaArrimeId, nomenclatura } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Buscar cobranzas pendientes
      const cobranzasPendientes = await tx.actaCobranza.findMany({
        where: {
          actaFundicion: {
            alianzaId: Number(alianzaId),
          },
          estado: 'PENDIENTE',
          saldoActual: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
      });

      let montoRestante = Number(montoArrime);
      const detallesCobranza = [];
      let totalAplicado = 0;

      // Aplicar a cobranzas pendientes
      for (const cobranza of cobranzasPendientes) {
        if (montoRestante <= 0) break;

        const montoAplicar = Math.min(montoRestante, cobranza.saldoActual);

        // Crear detalle de aplicación
        const detalle = await tx.detalleArrimeCobranza.create({
          data: {
            actaArrime: { connect: { id: Number(actaArrimeId) } },
            actaCobranza: { connect: { id: cobranza.id } },
            montoAplicado: montoAplicar,
          },
          include: {
            actaCobranza: true,
          },
        });

        // Actualizar saldo de la cobranza
        const nuevoSaldoCobranza = cobranza.saldoActual - montoAplicar;
        const nuevoEstado = nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE';

        await tx.actaCobranza.update({
          where: { id: cobranza.id },
          data: {
            saldoActual: nuevoSaldoCobranza,
            estado: nuevoEstado,
          },
        });

        // Obtener saldo actual de la alianza
        const alianzaActual = await tx.alianza.findUnique({
          where: { id: Number(alianzaId) },
          select: { saldoDeuda: true },
        });

        // Actualizar saldo de deuda de la alianza
        const nuevoSaldoAlianza = Math.max(
          0,
          alianzaActual.saldoDeuda - montoAplicar
        );
        await tx.alianza.update({
          where: { id: Number(alianzaId) },
          data: { saldoDeuda: nuevoSaldoAlianza },
        });

        // Registrar movimiento en historial
        await tx.historialMovimientoSaldo.create({
          data: {
            alianza: { connect: { id: Number(alianzaId) } },
            actaCobranza: { connect: { id: cobranza.id } },
            tipo: 'APLICACION_ARRIME',
            monto: -montoAplicar,
            saldoAntes: alianzaActual.saldoDeuda,
            saldoDespues: nuevoSaldoAlianza,
            descripcion: `Aplicación de arrime ${nomenclatura} por ${montoAplicar} gr`,
          },
        });

        detallesCobranza.push({
          ...detalle,
          totalCobranza: cobranza.totalCobranza,
        });

        totalAplicado += montoAplicar;
        montoRestante -= montoAplicar;
      }

      // Si queda excedente, crear saldo a favor
      let movimientoExcedente = null;
      if (montoRestante > 0) {
        // Obtener saldo actual de la alianza
        const alianzaActual = await tx.alianza.findUnique({
          where: { id: Number(alianzaId) },
          select: { saldoDeuda: true },
        });

        // Actualizar saldo de la alianza (negativo = saldo a favor)
        const nuevoSaldoAlianza = alianzaActual.saldoDeuda - montoRestante;
        await tx.alianza.update({
          where: { id: Number(alianzaId) },
          data: { saldoDeuda: nuevoSaldoAlianza },
        });

        // Registrar movimiento de excedente
        movimientoExcedente = await tx.historialMovimientoSaldo.create({
          data: {
            alianza: { connect: { id: Number(alianzaId) } },
            tipo: 'EXCEDENTE_ARRIME',
            monto: -montoRestante,
            saldoAntes: alianzaActual.saldoDeuda,
            saldoDespues: nuevoSaldoAlianza,
            descripcion: `Excedente de arrime ${nomenclatura} por ${montoRestante} gr - Saldo a favor`,
          },
        });
      }

      return {
        totalAplicado,
        excedente: montoRestante,
        detallesCobranza,
        movimientoExcedente,
        cobranzasSaldadas: detallesCobranza.filter(
          (d) => d.actaCobranza.estado === 'SALDADA'
        ).length,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error procesando arrime completo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de movimientos de saldo
app.get('/alianzas/:id/historial-movimientos', async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 20 } = req.query;

    const movimientos = await prisma.historialMovimientoSaldo.findMany({
      where: { alianzaId: Number(id) },
      orderBy: { fecha: 'desc' },
      take: Number(limite),
      include: {
        actaCobranza: true,
      },
    });

    res.json(movimientos);
  } catch (error) {
    console.error('Error obteniendo historial de movimientos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener saldos a favor disponibles de una alianza
app.get('/alianzas/:id/saldos-a-favor', async (req, res) => {
  try {
    const { id } = req.params;

    const saldosAFavor = await prisma.saldoAFavor.findMany({
      where: {
        alianzaId: Number(id),
        estado: { in: ['DISPONIBLE', 'PARCIALMENTE_USADO'] },
        montoDisponible: { gt: 0 },
      },
      orderBy: { fechaCreacion: 'asc' }, // FIFO - primero en entrar, primero en salir
      include: {
        actaArrime: {
          select: {
            nomenclatura: true,
            fecha: true,
          },
        },
        aplicaciones: {
          include: {
            actaCobranza: {
              select: {
                correlativo: true,
              },
            },
          },
        },
      },
    });

    const totalDisponible = saldosAFavor.reduce(
      (sum, saldo) => sum + saldo.montoDisponible,
      0
    );

    res.json({
      saldosAFavor,
      totalDisponible,
      cantidad: saldosAFavor.length,
    });
  } catch (error) {
    console.error('Error obteniendo saldos a favor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aplicar saldo a favor específico a una cobranza
app.post('/saldos-a-favor/aplicar', async (req, res) => {
  try {
    const { saldoAFavorId, actaCobranzaId, montoAplicar } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Obtener el saldo a favor específico
      const saldoAFavor = await tx.saldoAFavor.findUnique({
        where: { id: Number(saldoAFavorId) },
        include: { alianza: true, actaArrime: true },
      });

      if (!saldoAFavor) {
        throw new Error('Saldo a favor no encontrado');
      }

      if (saldoAFavor.montoDisponible <= 0) {
        throw new Error('Este saldo a favor ya está agotado');
      }

      // Obtener la cobranza
      const cobranza = await tx.actaCobranza.findUnique({
        where: { id: Number(actaCobranzaId) },
      });

      if (!cobranza) {
        throw new Error('Cobranza no encontrada');
      }

      if (cobranza.saldoActual <= 0) {
        throw new Error('La cobranza ya está saldada');
      }

      // Validar que el monto no exceda lo disponible
      const montoAAplicar = Number(montoAplicar);

      // Función para comparar números flotantes con tolerancia
      const esIgualOMenor = (a, b, tolerancia = 0.01) => {
        return a <= b + tolerancia;
      };

      console.log('DEBUG - Aplicar saldo a favor:');
      console.log('  Monto a aplicar:', montoAAplicar);
      console.log('  Saldo disponible:', saldoAFavor.montoDisponible);
      console.log('  Saldo cobranza:', cobranza.saldoActual);
      console.log(
        '  Diferencia con saldo disponible:',
        montoAAplicar - saldoAFavor.montoDisponible
      );
      console.log(
        '  Diferencia con saldo cobranza:',
        montoAAplicar - cobranza.saldoActual
      );

      if (!esIgualOMenor(montoAAplicar, saldoAFavor.montoDisponible)) {
        throw new Error(
          `Solo hay ${saldoAFavor.montoDisponible.toFixed(
            2
          )} gr disponibles en este saldo (intentando aplicar ${montoAAplicar.toFixed(
            2
          )} gr)`
        );
      }

      if (!esIgualOMenor(montoAAplicar, cobranza.saldoActual)) {
        throw new Error(
          `El monto no puede exceder el saldo de la cobranza (${cobranza.saldoActual.toFixed(
            2
          )} gr, intentando aplicar ${montoAAplicar.toFixed(2)} gr)`
        );
      }

      // Crear aplicación
      const aplicacion = await tx.aplicacionSaldoAFavor.create({
        data: {
          saldoAFavor: { connect: { id: saldoAFavor.id } },
          actaCobranza: { connect: { id: Number(actaCobranzaId) } },
          montoAplicado: montoAAplicar,
          descripcion: `Aplicación de saldo a favor (${saldoAFavor.actaArrime?.nomenclatura}) a cobranza ${cobranza.correlativo}`,
        },
      });

      // Actualizar saldo a favor
      const nuevoMontoDisponible = saldoAFavor.montoDisponible - montoAAplicar;
      const nuevoEstado =
        nuevoMontoDisponible <= 0 ? 'AGOTADO' : 'PARCIALMENTE_USADO';

      await tx.saldoAFavor.update({
        where: { id: saldoAFavor.id },
        data: {
          montoDisponible: nuevoMontoDisponible,
          estado: nuevoEstado,
          fechaUso: new Date(),
        },
      });

      // Actualizar cobranza
      const nuevoSaldoCobranza = cobranza.saldoActual - montoAAplicar;
      const nuevoEstadoCobranza =
        nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE';

      await tx.actaCobranza.update({
        where: { id: Number(actaCobranzaId) },
        data: {
          saldoActual: nuevoSaldoCobranza,
          estado: nuevoEstadoCobranza,
        },
      });

      // Actualizar saldo de deuda de la alianza
      const nuevoSaldoDeuda = Math.max(
        0,
        saldoAFavor.alianza.saldoDeuda - montoAAplicar
      );
      await tx.alianza.update({
        where: { id: saldoAFavor.alianza.id },
        data: { saldoDeuda: nuevoSaldoDeuda },
      });

      // Registrar movimiento
      await tx.historialMovimientoSaldo.create({
        data: {
          alianza: { connect: { id: saldoAFavor.alianza.id } },
          actaCobranza: { connect: { id: Number(actaCobranzaId) } },
          tipo: 'APLICACION_SALDO_FAVOR',
          monto: -montoAAplicar,
          saldoAntes: saldoAFavor.alianza.saldoDeuda,
          saldoDespues: nuevoSaldoDeuda,
          descripcion: `Aplicación de saldo a favor (${
            saldoAFavor.actaArrime?.nomenclatura
          }) por ${montoAAplicar.toFixed(2)} gr a cobranza ${
            cobranza.correlativo
          }`,
        },
      });

      console.log('DEBUG - Transacción completada exitosamente');
      console.log('  Nuevo saldo cobranza:', nuevoSaldoCobranza);
      console.log('  Nuevo estado cobranza:', nuevoEstadoCobranza);
      console.log('  Nuevo monto disponible saldo:', nuevoMontoDisponible);
      console.log('  Nuevo estado saldo:', nuevoEstado);

      return {
        montoAplicado: montoAAplicar,
        nuevoSaldoCobranza,
        nuevoEstadoCobranza,
        saldoAFavorId: saldoAFavor.id,
        nuevoMontoDisponible,
        nuevoEstadoSaldo: nuevoEstado,
        trazabilidad: {
          origenArrime: saldoAFavor.actaArrime?.nomenclatura,
          destinoCobranza: cobranza.correlativo,
          alianza: saldoAFavor.alianza.nombre,
        },
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error aplicando saldo a favor:', error);
    res.status(500).json({ error: error.message });
  }
});

// === Actas de Arrime ===

// Listar actas de arrime
app.get('/actas-arrime', async (req, res) => {
  try {
    const actasArrime = await prisma.actaArrime.findMany({
      include: {
        sector: true,
        alianza: true,
        funcionario: true,
        barras: true,
        detallesCobranza: {
          include: {
            actaCobranza: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(actasArrime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear acta de arrime
app.post('/actas-arrime', async (req, res) => {
  try {
    const data = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Buscar funcionario activo de la alianza
      const funcionario = await tx.funcionario.findFirst({
        where: {
          alianzaId: Number(data.alianzaId),
          estatus: 'ACTIVO',
        },
      });

      if (!funcionario) {
        throw new Error('No se encontró funcionario activo para esta alianza');
      }

      // Buscar alianza para obtener datos
      const alianza = await tx.alianza.findUnique({
        where: { id: Number(data.alianzaId) },
        include: { sector: true },
      });

      // Generar nomenclatura
      const sector = alianza.sector.nombre.replace(/\s+/g, '');
      const actasDelSector = await tx.actaArrime.count({
        where: { sectorId: Number(data.sectorId) },
      });
      const correlativo = String(actasDelSector + 1).padStart(4, '0');
      const fecha = new Date(data.fecha);
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      const nomenclatura = `CVM-GGP-GPM-${sector}-${correlativo}/${mes}/${anio}`;

      // Crear acta de arrime
      const actaArrime = await tx.actaArrime.create({
        data: {
          sector: { connect: { id: Number(data.sectorId) } },
          alianza: { connect: { id: Number(data.alianzaId) } },
          funcionario: { connect: { id: funcionario.id } },
          representanteLegal: alianza.representanteLegal,
          rifAlianza: alianza.rif,
          nomenclatura: data.nomenclatura || nomenclatura,
          fecha: new Date(data.fecha),
          piezas: Number(data.piezas),
          pesoBruto: Number(data.pesoBruto),
          tipoLey: String(data.tipoLey),
          pesoFino: Number(data.pesoFino),
          observaciones: data.observaciones || '',
          barras: {
            create:
              data.barras?.map((barra) => ({
                numeroBarra: Number(barra.numeroBarra),
                pesoBruto: Number(barra.pesoBruto),
                promedioLey: Number(barra.promedioLey),
                pesoFino: Number(barra.pesoFino),
                precintoBarra: barra.precintoBarra || '',
              })) || [],
          },
        },
        include: {
          sector: true,
          alianza: true,
          funcionario: true,
          barras: true,
        },
      });

      // CREAR BARRAS DE ORO AUTOMÁTICAMENTE PARA F2
      // Cada barra del arrime se convierte en una barra de oro disponible para refundición
      if (data.barras && data.barras.length > 0) {
        for (let i = 0; i < data.barras.length; i++) {
          const barra = data.barras[i];

          // Generar identificador único para la barra de oro
          const identificadorBarra = `${nomenclatura}-B${String(i + 1).padStart(
            2,
            '0'
          )}`;

          await tx.barraDeOro.create({
            data: {
              identificador: identificadorBarra,
              pesoBruto: Number(barra.pesoBruto),
              tipoLey: Number(barra.promedioLey),
              pesoFino: Number(barra.pesoFino),
              origen: `Arrime ${nomenclatura}`,
              alianza: { connect: { id: Number(data.alianzaId) } },
              observaciones: `Barra generada automáticamente del arrime ${nomenclatura} - Barra #${
                i + 1
              }${
                barra.precintoBarra ? ` - Precinto: ${barra.precintoBarra}` : ''
              }`,
              refundida: false,
            },
          });
        }
      }

      // Procesar cobranzas seleccionadas manualmente (si las hay)
      let montoRestante = Number(data.pesoBruto);
      const detallesCobranza = [];
      let totalAplicado = 0;

      if (
        data.cobranzasSeleccionadas &&
        data.cobranzasSeleccionadas.length > 0
      ) {
        // Aplicar a cobranzas específicamente seleccionadas
        for (const seleccion of data.cobranzasSeleccionadas) {
          const cobranza = await tx.actaCobranza.findUnique({
            where: { id: Number(seleccion.cobranzaId) },
          });

          if (!cobranza || cobranza.saldoActual <= 0) continue;

          const montoAplicar = Math.min(
            Number(seleccion.montoAplicar),
            cobranza.saldoActual,
            montoRestante
          );

          if (montoAplicar <= 0) continue;

          // Crear detalle de aplicación
          const detalle = await tx.detalleArrimeCobranza.create({
            data: {
              actaArrime: { connect: { id: actaArrime.id } },
              actaCobranza: { connect: { id: cobranza.id } },
              montoAplicado: montoAplicar,
            },
            include: {
              actaCobranza: true,
            },
          });

          // Actualizar saldo de la cobranza
          const nuevoSaldoCobranza = cobranza.saldoActual - montoAplicar;
          const nuevoEstado = nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE';

          await tx.actaCobranza.update({
            where: { id: cobranza.id },
            data: {
              saldoActual: nuevoSaldoCobranza,
              estado: nuevoEstado,
            },
          });

          // Obtener saldo actual de la alianza
          const alianzaActual = await tx.alianza.findUnique({
            where: { id: Number(data.alianzaId) },
            select: { saldoDeuda: true },
          });

          // Actualizar saldo de deuda de la alianza
          const nuevoSaldoAlianza = Math.max(
            0,
            alianzaActual.saldoDeuda - montoAplicar
          );
          await tx.alianza.update({
            where: { id: Number(data.alianzaId) },
            data: { saldoDeuda: nuevoSaldoAlianza },
          });

          // Registrar movimiento en historial
          await tx.historialMovimientoSaldo.create({
            data: {
              alianza: { connect: { id: Number(data.alianzaId) } },
              actaCobranza: { connect: { id: cobranza.id } },
              tipo: 'APLICACION_ARRIME',
              monto: -montoAplicar,
              saldoAntes: alianzaActual.saldoDeuda,
              saldoDespues: nuevoSaldoAlianza,
              descripcion: `Aplicación de arrime ${nomenclatura} por ${montoAplicar} gr`,
            },
          });

          detallesCobranza.push({
            ...detalle,
            totalCobranza: cobranza.totalCobranza,
          });

          totalAplicado += montoAplicar;
          montoRestante -= montoAplicar;
        }
      }

      // CRÍTICO: Si queda excedente, crear saldo a favor como entidad separada
      if (montoRestante > 0) {
        // Determinar si es excedente o saldo a favor completo
        const esExcedente =
          data.cobranzasSeleccionadas && data.cobranzasSeleccionadas.length > 0;
        const descripcionTipo = esExcedente ? 'Excedente' : 'Saldo a favor';

        // Crear saldo a favor como entidad independiente
        await tx.saldoAFavor.create({
          data: {
            alianza: { connect: { id: Number(data.alianzaId) } },
            actaArrime: { connect: { id: actaArrime.id } },
            monto: montoRestante,
            montoDisponible: montoRestante,
            descripcion: `${descripcionTipo} de arrime ${nomenclatura} por ${montoRestante} gr`,
            estado: 'DISPONIBLE',
          },
        });

        // Registrar movimiento de excedente (sin afectar saldoDeuda)
        await tx.historialMovimientoSaldo.create({
          data: {
            alianza: { connect: { id: Number(data.alianzaId) } },
            tipo: 'EXCEDENTE_ARRIME',
            monto: montoRestante,
            saldoAntes: 0, // No afecta el saldo de deuda
            saldoDespues: 0,
            descripcion: `${descripcionTipo} de arrime ${nomenclatura} por ${montoRestante} gr - Disponible como saldo a favor`,
          },
        });
      }

      return { acta: actaArrime, detalles: detallesCobranza };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando acta de arrime:', error);
    res.status(400).json({ error: error.message });
  }
});

// === ACTAS DE FUNDICIÓN F2 (REFUNDICIÓN) ===

// Listar barras de oro disponibles para refundición
app.get('/barras-oro', async (req, res) => {
  try {
    const barras = await prisma.barraDeOro.findMany({
      where: {
        refundida: false, // Solo barras no refundidas
      },
      include: {
        alianza: {
          select: {
            id: true,
            nombre: true,
            rif: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    // Agregar información adicional sobre el origen
    const barrasConInfo = barras.map((barra) => ({
      ...barra,
      esDeArrime: barra.origen.includes('Arrime'),
      fechaCreacionFormateada: barra.fechaCreacion.toLocaleDateString('es-VE'),
    }));

    res.json(barrasConInfo);
  } catch (error) {
    console.error('Error obteniendo barras de oro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva barra de oro
app.post('/barras-oro', async (req, res) => {
  try {
    const {
      identificador,
      pesoBruto,
      tipoLey,
      origen,
      alianzaId,
      observaciones,
    } = req.body;

    // Calcular peso fino
    const pesoFino = (pesoBruto * tipoLey) / 1000;

    const barra = await prisma.barraDeOro.create({
      data: {
        identificador,
        pesoBruto: Number(pesoBruto),
        tipoLey: Number(tipoLey),
        pesoFino,
        origen,
        alianzaId: alianzaId ? Number(alianzaId) : null,
        observaciones,
      },
      include: {
        alianza: {
          select: {
            nombre: true,
            rif: true,
          },
        },
      },
    });

    res.status(201).json(barra);
  } catch (error) {
    console.error('Error creando barra de oro:', error);
    res.status(400).json({ error: error.message });
  }
});

// Crear Acta de Fundición F2
app.post('/actas-fundicion-f2', async (req, res) => {
  try {
    const { barrasSeleccionadas, observaciones } = req.body;

    if (!barrasSeleccionadas || barrasSeleccionadas.length === 0) {
      return res
        .status(400)
        .json({ error: 'Debe seleccionar al menos una barra' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verificar que todas las barras existen y no están refundidas
      const barras = await tx.barraDeOro.findMany({
        where: {
          id: { in: barrasSeleccionadas.map((id) => Number(id)) },
          refundida: false,
        },
      });

      if (barras.length !== barrasSeleccionadas.length) {
        throw new Error('Algunas barras no están disponibles para refundición');
      }

      // Calcular totales
      const pesoTotalBruto = barras.reduce(
        (sum, barra) => sum + barra.pesoBruto,
        0
      );
      const pesoTotalFino = barras.reduce(
        (sum, barra) => sum + barra.pesoFino,
        0
      );

      // Generar número de acta F2
      const año = new Date().getFullYear();
      const mes = String(new Date().getMonth() + 1).padStart(2, '0');

      // Buscar el último número del mes
      const ultimaActa = await tx.actaFundicionF2.findFirst({
        where: {
          numeroActa: {
            startsWith: `F2-${año}-${mes}-`,
          },
        },
        orderBy: {
          numeroActa: 'desc',
        },
      });

      let numeroSecuencial = 1;
      if (ultimaActa) {
        const ultimoNumero = ultimaActa.numeroActa.split('-')[3];
        numeroSecuencial = parseInt(ultimoNumero) + 1;
      }

      const numeroActa = `F2-${año}-${mes}-${String(numeroSecuencial).padStart(
        4,
        '0'
      )}`;

      // Crear el acta F2
      const actaF2 = await tx.actaFundicionF2.create({
        data: {
          numeroActa,
          pesoTotalBruto,
          pesoTotalFino,
          observaciones,
        },
      });

      // Crear relaciones con las barras
      for (const barraId of barrasSeleccionadas) {
        await tx.actaFundicionF2BarraDeOro.create({
          data: {
            actaFundicionF2Id: actaF2.id,
            barraDeOroId: Number(barraId),
          },
        });
      }

      // Marcar barras como refundidas
      await tx.barraDeOro.updateMany({
        where: {
          id: { in: barrasSeleccionadas.map((id) => Number(id)) },
        },
        data: {
          refundida: true,
        },
      });

      return { actaF2, barras, pesoTotalBruto, pesoTotalFino };
    });

    res.status(201).json({
      acta: result.actaF2,
      barrasUtilizadas: result.barras.length,
      pesoTotalBruto: result.pesoTotalBruto,
      pesoTotalFino: result.pesoTotalFino,
    });
  } catch (error) {
    console.error('Error creando acta F2:', error);
    res.status(400).json({ error: error.message });
  }
});

// Listar actas de fundición F2
app.get('/actas-fundicion-f2', async (req, res) => {
  try {
    const actas = await prisma.actaFundicionF2.findMany({
      include: {
        barrasUtilizadas: {
          include: {
            barraDeOro: {
              include: {
                alianza: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            barrasUtilizadas: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
    res.json(actas);
  } catch (error) {
    console.error('Error obteniendo actas F2:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generar documento para acta F2
app.post('/actas-fundicion-f2/:id/generar-documento', async (req, res) => {
  try {
    const { id } = req.params;

    const acta = await prisma.actaFundicionF2.findUnique({
      where: { id: Number(id) },
      include: {
        barrasUtilizadas: {
          include: {
            barraDeOro: {
              include: {
                alianza: {
                  select: {
                    nombre: true,
                    rif: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!acta) {
      return res.status(404).json({ error: 'Acta F2 no encontrada' });
    }

    // Aquí iría la lógica para generar el documento Word
    // Por ahora, simularemos la respuesta
    const documentData = {
      numeroActa: acta.numeroActa,
      fechaCreacion: acta.fechaCreacion.toLocaleDateString('es-VE'),
      pesoTotalBruto: acta.pesoTotalBruto.toFixed(2),
      pesoTotalFino: acta.pesoTotalFino.toFixed(2),
      cantidadBarras: acta.barrasUtilizadas.length,
      barras: acta.barrasUtilizadas.map((rel) => ({
        identificador: rel.barraDeOro.identificador,
        pesoBruto: rel.barraDeOro.pesoBruto.toFixed(2),
        tipoLey: rel.barraDeOro.tipoLey.toFixed(1),
        pesoFino: rel.barraDeOro.pesoFino.toFixed(2),
        origen: rel.barraDeOro.origen,
        alianza: rel.barraDeOro.alianza?.nombre || 'N/A',
      })),
    };

    res.json({
      message: 'Documento generado exitosamente',
      data: documentData,
    });
  } catch (error) {
    console.error('Error generando documento F2:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
