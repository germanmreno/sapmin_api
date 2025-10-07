const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtener estadísticas generales del dashboard
 */
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    // Estadísticas de Alianzas
    const totalAlianzas = await prisma.alianza.count();
    const alianzasActivas = await prisma.alianza.count({
      where: { estatus: 'ACTIVA' },
    });

    // Estadísticas de Actas de Fundición
    const totalActasFundicion = await prisma.actaFundicion.count();
    const actasFundicionMes = await prisma.actaFundicion.count({
      where: {
        fechaFundicion: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // Estadísticas de Actas F2
    const totalActasF2 = await prisma.actaFundicionF2.count();
    const estadisticasF2 = await prisma.actaFundicionF2.aggregate({
      _sum: {
        pesoFinalBarra: true,
        merma: true,
      },
    });

    // Estadísticas de Arrimes
    const totalArrimes = await prisma.actaArrime.count();
    const pesoTotalArrimes = await prisma.actaArrime.aggregate({
      _sum: { pesoFino: true },
    });

    // Estadísticas de Pequeña Minería
    const totalPequenaMineria = await prisma.alianzaPequenaMineria.count();
    const arrimesPequenaMineria = await prisma.actaArrimePequenaMineria.count();
    const pesoTotalPequenaMineria =
      await prisma.actaArrimePequenaMineria.aggregate({
        _sum: { montoPesoBruto: true },
      });

    // Estadísticas de Cobranza
    const totalCobranzas = await prisma.actaCobranza.count();
    const cobranzasPendientes = await prisma.actaCobranza.count({
      where: { estado: 'PENDIENTE' },
    });
    const totalRecaudado = await prisma.actaCobranza.aggregate({
      _sum: { totalCobranza: true },
    });

    // Deuda total
    const deudaTotal = await prisma.alianza.aggregate({
      _sum: { saldoDeuda: true },
    });

    res.json({
      alianzas: {
        total: totalAlianzas,
        activas: alianzasActivas,
        inactivas: totalAlianzas - alianzasActivas,
      },
      fundicion: {
        totalActas: totalActasFundicion,
        actasMes: actasFundicionMes,
      },
      fundicionF2: {
        totalActas: totalActasF2,
        pesoTotal: estadisticasF2._sum.pesoFinalBarra || 0,
        mermaTotal: estadisticasF2._sum.merma || 0,
      },
      arrimes: {
        total: totalArrimes,
        pesoTotal: pesoTotalArrimes._sum.pesoFino || 0,
      },
      pequenaMineria: {
        totalAlianzas: totalPequenaMineria,
        totalArrimes: arrimesPequenaMineria,
        pesoTotal: pesoTotalPequenaMineria._sum.montoPesoBruto || 0,
      },
      cobranza: {
        total: totalCobranzas,
        pendientes: cobranzasPendientes,
        saldadas: totalCobranzas - cobranzasPendientes,
        totalRecaudado: totalRecaudado._sum.totalCobranza || 0,
      },
      deuda: {
        total: deudaTotal._sum.saldoDeuda || 0,
      },
      recaudacionTotal: {
        oro:
          (pesoTotalArrimes._sum.pesoFino || 0) +
          (pesoTotalPequenaMineria._sum.montoPesoBruto || 0),
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener estadísticas por mes (últimos 6 meses)
 */
exports.getEstadisticasPorMes = async (req, res) => {
  try {
    const meses = [];
    const hoy = new Date();

    // Generar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const siguienteMes = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - i + 1,
        1
      );

      const actasFundicion = await prisma.actaFundicion.count({
        where: {
          fechaFundicion: {
            gte: fecha,
            lt: siguienteMes,
          },
        },
      });

      const arrimes = await prisma.actaArrime.count({
        where: {
          fecha: {
            gte: fecha,
            lt: siguienteMes,
          },
        },
      });

      const cobranzas = await prisma.actaCobranza.aggregate({
        where: {
          createdAt: {
            gte: fecha,
            lt: siguienteMes,
          },
        },
        _sum: { totalCobranza: true },
      });

      meses.push({
        mes: fecha.toLocaleDateString('es-ES', {
          month: 'short',
          year: 'numeric',
        }),
        actasFundicion,
        arrimes,
        cobranza: cobranzas._sum.totalCobranza || 0,
      });
    }

    res.json(meses);
  } catch (error) {
    console.error('Error obteniendo estadísticas por mes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener top alianzas por producción
 */
exports.getTopAlianzas = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const alianzas = await prisma.alianza.findMany({
      include: {
        actasArrime: {
          select: {
            pesoFino: true,
          },
        },
      },
      take: parseInt(limit),
    });

    const alianzasConTotal = alianzas.map((alianza) => ({
      nombre: alianza.nombre,
      pesoTotal: alianza.actasArrime.reduce(
        (sum, acta) => sum + acta.pesoFino,
        0
      ),
      cantidadArrimes: alianza.actasArrime.length,
    }));

    // Ordenar por peso total
    alianzasConTotal.sort((a, b) => b.pesoTotal - a.pesoTotal);

    res.json(alianzasConTotal.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error obteniendo top alianzas:', error);
    res.status(500).json({ error: error.message });
  }
};
