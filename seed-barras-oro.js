const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBarrasOro() {
  try {
    console.log('🌱 Creando barras de oro de prueba...');

    // Obtener algunas alianzas existentes
    const alianzas = await prisma.alianza.findMany({
      take: 3,
    });

    const barrasData = [
      {
        identificador: 'BO-2024-001',
        pesoBruto: 450.5,
        tipoLey: 999.9,
        origen: 'Inventario',
        alianzaId: null,
        observaciones: 'Barra de alta pureza del inventario general',
      },
      {
        identificador: 'BO-2024-002',
        pesoBruto: 380.2,
        tipoLey: 995.0,
        origen: 'Alianza',
        alianzaId: alianzas[0]?.id || null,
        observaciones: 'Proveniente de fundición anterior',
      },
      {
        identificador: 'BO-2024-003',
        pesoBruto: 520.8,
        tipoLey: 999.5,
        origen: 'Inventario',
        alianzaId: null,
        observaciones: 'Barra consolidada de múltiples fuentes',
      },
      {
        identificador: 'BO-2024-004',
        pesoBruto: 290.3,
        tipoLey: 990.0,
        origen: 'Alianza',
        alianzaId: alianzas[1]?.id || null,
        observaciones: 'Barra pequeña para completar fundición',
      },
      {
        identificador: 'BO-2024-005',
        pesoBruto: 680.7,
        tipoLey: 999.9,
        origen: 'Inventario',
        alianzaId: null,
        observaciones: 'Barra de gran tamaño y alta pureza',
      },
      {
        identificador: 'BO-2024-006',
        pesoBruto: 340.1,
        tipoLey: 995.5,
        origen: 'Alianza',
        alianzaId: alianzas[2]?.id || null,
        observaciones: 'Barra estándar de alianza',
      },
      {
        identificador: 'BO-2024-007',
        pesoBruto: 425.9,
        tipoLey: 999.0,
        origen: 'Inventario',
        alianzaId: null,
        observaciones: 'Barra refinada recientemente',
      },
      {
        identificador: 'BO-2024-008',
        pesoBruto: 310.4,
        tipoLey: 992.0,
        origen: 'Alianza',
        alianzaId: alianzas[0]?.id || null,
        observaciones: 'Barra complementaria',
      },
      {
        identificador: 'BO-2024-009',
        pesoBruto: 590.6,
        tipoLey: 999.8,
        origen: 'Inventario',
        alianzaId: null,
        observaciones: 'Barra de excelente calidad',
      },
      {
        identificador: 'BO-2024-010',
        pesoBruto: 275.2,
        tipoLey: 988.0,
        origen: 'Alianza',
        alianzaId: alianzas[1]?.id || null,
        observaciones: 'Barra de menor pureza para ajustes',
      },
    ];

    for (const barraData of barrasData) {
      // Calcular peso fino
      const pesoFino = (barraData.pesoBruto * barraData.tipoLey) / 1000;

      await prisma.barraDeOro.create({
        data: {
          ...barraData,
          pesoFino,
        },
      });
    }

    console.log(`✅ Se crearon ${barrasData.length} barras de oro de prueba`);

    // Mostrar resumen
    const totalBarras = await prisma.barraDeOro.count();
    const pesoTotalBruto = await prisma.barraDeOro.aggregate({
      _sum: {
        pesoBruto: true,
        pesoFino: true,
      },
    });

    console.log(`📊 Resumen:`);
    console.log(`   Total de barras: ${totalBarras}`);
    console.log(
      `   Peso bruto total: ${pesoTotalBruto._sum.pesoBruto?.toFixed(2)} g`
    );
    console.log(
      `   Peso fino total: ${pesoTotalBruto._sum.pesoFino?.toFixed(2)} g`
    );
  } catch (error) {
    console.error('❌ Error creando barras de oro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedBarrasOro();
}

module.exports = { seedBarrasOro };
