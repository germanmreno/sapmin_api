const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { format } = require('date-fns');

/**
 * Listar actas F2 con paginación y estadísticas
 */
exports.listarActas = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Obtener total de registros
  const total = await prisma.actaFundicionF2.count();

  // Obtener estadísticas totales
  const estadisticasTotales = await prisma.actaFundicionF2.aggregate({
    _sum: {
      pesoTotalPiezas: true,
      pesoFinalBarra: true,
      merma: true,
    },
    _count: {
      id: true,
    },
  });

  // Contar actas del mes actual
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDiaMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const actasDelMes = await prisma.actaFundicionF2.count({
    where: {
      fechaActa: {
        gte: primerDiaMes,
        lte: ultimoDiaMes,
      },
    },
  });

  // Obtener actas con paginación
  const actas = await prisma.actaFundicionF2.findMany({
    include: {
      piezasUtilizadas: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { fechaCreacion: 'desc' },
    skip,
    take: limit,
  });

  // Formatear datos
  const actasFormateadas = actas.map((acta) => ({
    ...acta,
    fechaActaFormateada: format(new Date(acta.fechaActa), 'dd/MM/yyyy'),
    fechaCreacionFormateada: format(
      new Date(acta.fechaCreacion),
      'dd/MM/yyyy HH:mm'
    ),
    cantidadPiezas: acta.piezasUtilizadas.length,
    porcentajeMerma:
      acta.pesoTotalPiezas > 0 ? (acta.merma / acta.pesoTotalPiezas) * 100 : 0,
  }));

  return {
    data: actasFormateadas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    estadisticas: {
      totalActas: total,
      totalPesoFundido: estadisticasTotales._sum.pesoFinalBarra || 0,
      totalMerma: estadisticasTotales._sum.merma || 0,
      actasDelMes,
    },
  };
};

/**
 * Obtener detalles de un acta F2 específica
 */
exports.obtenerDetalle = async (id) => {
  const acta = await prisma.actaFundicionF2.findUnique({
    where: { id },
    include: {
      piezasUtilizadas: {
        include: {
          alianza: true,
          alianzaPequenaMineria: true,
          actaArrimePequenaMineria: {
            include: {
              sector: true,
            },
          },
        },
      },
    },
  });

  if (!acta) {
    return null;
  }

  // Formatear datos
  const actaFormateada = {
    ...acta,
    fechaActaFormateada: format(new Date(acta.fechaActa), 'dd/MM/yyyy'),
    fechaCreacionFormateada: format(
      new Date(acta.fechaCreacion),
      'dd/MM/yyyy HH:mm'
    ),
    porcentajeMerma:
      acta.pesoTotalPiezas > 0 ? (acta.merma / acta.pesoTotalPiezas) * 100 : 0,
    piezasFormateadas: acta.piezasUtilizadas.map((pieza) => {
      const esDeArrime = !!pieza.actaArrimePequenaMineria;
      const esDePequenaMineria = !!pieza.alianzaPequenaMineria;

      return {
        ...pieza,
        origen: esDePequenaMineria
          ? 'Pequeña Minería'
          : esDeArrime
          ? 'Arrime'
          : 'Manual',
        alianzaInfo: pieza.alianza || pieza.alianzaPequenaMineria || null,
        sectorInfo: pieza.actaArrimePequenaMineria?.sector || null,
        actaOrigenNumero: pieza.actaArrimePequenaMineria?.numeroActa || 'N/A',
      };
    }),
  };

  return actaFormateada;
};

/**
 * Crear nueva acta F2
 */
exports.crearActa = async (datos) => {
  const {
    numeroActa,
    fechaActa,
    barrasSeleccionadas,
    pesoFinalBarra,
    observaciones,
  } = datos;

  // Verificar que el número de acta no exista
  const actaExistente = await prisma.actaFundicionF2.findUnique({
    where: { numeroActa },
  });

  if (actaExistente) {
    throw new Error(`El número de acta ${numeroActa} ya existe`);
  }

  // Verificar que las barras existan y no estén refundidas
  const barras = await prisma.barraDeOro.findMany({
    where: {
      id: { in: barrasSeleccionadas.map((id) => Number(id)) },
      refundida: false,
    },
  });

  if (barras.length !== barrasSeleccionadas.length) {
    throw new Error(
      'Algunas barras no están disponibles o ya fueron refundidas'
    );
  }

  // Calcular totales
  const pesoTotalPiezas = barras.reduce(
    (sum, barra) => sum + barra.pesoBruto,
    0
  );
  const pesoFinal = parseFloat(pesoFinalBarra);
  const merma = pesoTotalPiezas - pesoFinal;

  // Crear acta en transacción
  const resultado = await prisma.$transaction(async (tx) => {
    // Crear acta F2
    const nuevaActa = await tx.actaFundicionF2.create({
      data: {
        numeroActa,
        fechaActa: new Date(fechaActa),
        pesoTotalPiezas,
        pesoFinalBarra: pesoFinal,
        merma,
        observaciones: observaciones || '',
      },
    });

    // Marcar barras como refundidas y vincularlas al acta
    await tx.barraDeOro.updateMany({
      where: { id: { in: barrasSeleccionadas.map((id) => Number(id)) } },
      data: {
        refundida: true,
        actaFundicionF2Id: nuevaActa.id,
      },
    });

    return nuevaActa;
  });

  return {
    acta: resultado,
    message: `Acta F2 ${numeroActa} creada exitosamente`,
  };
};

/**
 * Generar documento PDF de un acta F2
 */
exports.generarDocumento = async (id) => {
  const acta = await exports.obtenerDetalle(id);

  if (!acta) {
    return null;
  }

  // Aquí iría la lógica de generación de PDF
  // Por ahora retornamos los datos formateados
  return {
    message: 'Documento generado exitosamente',
    data: acta,
  };
};
