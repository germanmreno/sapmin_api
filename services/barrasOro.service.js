const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { format } = require('date-fns');

/**
 * Listar barras de oro con filtros
 */
exports.listarBarras = async (mostrarRefundidas = false) => {
  const where = {};

  // Filtrar refundidas si no se deben mostrar
  if (!mostrarRefundidas) {
    where.refundida = false;
  }

  const barras = await prisma.barraDeOro.findMany({
    where,
    include: {
      alianza: true,
      alianzaPequenaMineria: true,
      actaArrimePequenaMineria: {
        include: {
          sector: true,
        },
      },
      actaFundicionF2: true, // Incluir acta F2 si está refundida
    },
    orderBy: { fechaCreacion: 'desc' },
  });

  // Formatear datos para el frontend
  const barrasFormateadas = barras.map((barra) => {
    const esDeArrime = !!barra.actaArrimePequenaMineria;
    const esDePequenaMineria = !!barra.alianzaPequenaMineria;

    return {
      ...barra,
      origen: esDePequenaMineria
        ? 'Pequeña Minería'
        : esDeArrime
        ? 'Arrime'
        : 'Manual',
      esDeArrime,
      esDePequenaMineria,
      alianzaInfo: barra.alianza || barra.alianzaPequenaMineria || null,
      sectorInfo: barra.actaArrimePequenaMineria?.sector || null,
      fechaCreacionFormateada: format(
        new Date(barra.fechaCreacion),
        'dd/MM/yyyy'
      ),
      // Información de refundición
      estaRefundida: barra.refundida || false,
      actaF2Info: barra.actaFundicionF2 || null,
    };
  });

  return barrasFormateadas;
};

/**
 * Obtener detalles de una barra específica
 */
exports.obtenerDetalle = async (id) => {
  const barra = await prisma.barraDeOro.findUnique({
    where: { id },
    include: {
      alianza: true,
      alianzaPequenaMineria: true,
      actaArrimePequenaMineria: {
        include: {
          sector: true,
        },
      },
      actaFundicionF2: true,
    },
  });

  if (!barra) {
    return null;
  }

  const esDeArrime = !!barra.actaArrimePequenaMineria;
  const esDePequenaMineria = !!barra.alianzaPequenaMineria;

  return {
    ...barra,
    origen: esDePequenaMineria
      ? 'Pequeña Minería'
      : esDeArrime
      ? 'Arrime'
      : 'Manual',
    esDeArrime,
    esDePequenaMineria,
    alianzaInfo: barra.alianza || barra.alianzaPequenaMineria || null,
    sectorInfo: barra.actaArrimePequenaMineria?.sector || null,
    fechaCreacionFormateada: format(
      new Date(barra.fechaCreacion),
      'dd/MM/yyyy'
    ),
    estaRefundida: barra.refundida || false,
    actaF2Info: barra.actaFundicionF2 || null,
  };
};

/**
 * Crear nueva barra de oro
 */
exports.crearBarra = async (datos) => {
  const {
    identificador,
    pesoBruto,
    tipoLey,
    origen,
    alianzaId,
    alianzaPequenaMineriaId,
    actaArrimePequenaMineriaId,
    precintoBarra,
    observaciones,
  } = datos;

  // Calcular peso fino
  const pesoFino = (pesoBruto * tipoLey) / 1000;

  const nuevaBarra = await prisma.barraDeOro.create({
    data: {
      identificador,
      pesoBruto: parseFloat(pesoBruto),
      tipoLey: parseFloat(tipoLey),
      pesoFino,
      origen,
      alianzaId: alianzaId ? parseInt(alianzaId) : null,
      alianzaPequenaMineriaId: alianzaPequenaMineriaId
        ? parseInt(alianzaPequenaMineriaId)
        : null,
      actaArrimePequenaMineriaId: actaArrimePequenaMineriaId
        ? parseInt(actaArrimePequenaMineriaId)
        : null,
      precintoBarra: precintoBarra || null,
      observaciones: observaciones || null,
    },
  });

  return nuevaBarra;
};
