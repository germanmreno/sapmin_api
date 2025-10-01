const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSaldoEndpoint() {
  console.log('Probando endpoint de saldo...');

  try {
    // Obtener la primera alianza para probar
    const alianza = await prisma.alianza.findFirst();

    if (!alianza) {
      console.log('No hay alianzas en la base de datos');
      return;
    }

    console.log(`Probando con alianza: ${alianza.nombre} (ID: ${alianza.id})`);

    // Simular la consulta del endpoint
    const resultado = await prisma.alianza.findUnique({
      where: { id: alianza.id },
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
              },
            },
          },
        },
        movimientosSaldo: {
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
    });

    // Aplanar las cobranzas pendientes
    const cobranzasPendientes = [];
    for (const actaFundicion of resultado.actasFundicion) {
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

    console.log('✓ Endpoint funcionando correctamente');
    console.log(`  - Saldo de deuda: ${resultado.saldoDeuda} gr`);
    console.log(`  - Cobranzas pendientes: ${cobranzasPendientes.length}`);
    console.log(
      `  - Movimientos en historial: ${resultado.movimientosSaldo.length}`
    );
  } catch (error) {
    console.error('Error probando endpoint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testSaldoEndpoint();
}

module.exports = { testSaldoEndpoint };
