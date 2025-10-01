const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Limpiando base de datos para simulación...\n');

  try {
    // Eliminar en orden correcto para respetar las relaciones
    console.log('Eliminando historial de movimientos...');
    await prisma.historialMovimientoSaldo.deleteMany({});

    console.log('Eliminando detalles de arrime-cobranza...');
    await prisma.detalleArrimeCobranza.deleteMany({});

    console.log('Eliminando actas de arrime...');
    await prisma.actaArrime.deleteMany({});

    console.log('Eliminando actas de cobranza...');
    await prisma.actaCobranza.deleteMany({});

    console.log('Eliminando barras fundidas...');
    await prisma.barraFundida.deleteMany({});

    console.log('Eliminando actas de fundición...');
    await prisma.actaFundicion.deleteMany({});

    console.log('Eliminando elusiones...');
    await prisma.elusion.deleteMany({});

    console.log('Eliminando funcionarios...');
    await prisma.funcionario.deleteMany({});

    console.log('Eliminando alianzas...');
    await prisma.alianza.deleteMany({});

    console.log('Eliminando sectores...');
    await prisma.sector.deleteMany({});

    console.log('✅ Base de datos limpiada exitosamente.\n');
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log(
        '✨ Limpieza completada. Ahora puedes ejecutar la simulación.'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase };
