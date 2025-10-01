const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncSaldos() {
  console.log('Iniciando sincronización de saldos...');

  try {
    // Obtener todas las alianzas con sus actas de fundición y cobranzas
    const alianzas = await prisma.alianza.findMany({
      include: {
        actasFundicion: {
          include: {
            actasCobranza: {
              where: {
                estado: 'PENDIENTE',
              },
            },
          },
        },
      },
    });

    console.log(`Procesando ${alianzas.length} alianzas...`);

    for (const alianza of alianzas) {
      // Obtener todas las cobranzas pendientes de esta alianza
      const cobranzasPendientes = [];

      for (const actaFundicion of alianza.actasFundicion) {
        cobranzasPendientes.push(...actaFundicion.actasCobranza);
      }

      // Calcular el saldo total de cobranzas pendientes
      const saldoTotal = cobranzasPendientes.reduce((sum, cobranza) => {
        return sum + cobranza.totalCobranza;
      }, 0);

      // Actualizar el saldo de la alianza
      await prisma.alianza.update({
        where: { id: alianza.id },
        data: { saldoDeuda: saldoTotal },
      });

      // Actualizar saldoActual de cada cobranza pendiente
      for (const cobranza of cobranzasPendientes) {
        if (cobranza.saldoActual === 0) {
          await prisma.actaCobranza.update({
            where: { id: cobranza.id },
            data: { saldoActual: cobranza.totalCobranza },
          });
        }
      }

      console.log(
        `✓ Alianza ${alianza.nombre}: ${
          cobranzasPendientes.length
        } cobranzas pendientes, saldo actualizado a ${saldoTotal.toFixed(2)} gr`
      );
    }

    console.log('Sincronización completada exitosamente');
  } catch (error) {
    console.error('Error durante la sincronización:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncSaldos();
}

module.exports = { syncSaldos };
