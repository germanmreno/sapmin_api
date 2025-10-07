const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBarrasSinAlianza() {
  console.log('🔧 Iniciando corrección de barras sin alianza...\n');

  try {
    // Obtener todas las barras de pequeña minería sin alianza
    const barrasSinAlianza = await prisma.barraDeOro.findMany({
      where: {
        origen: {
          startsWith: 'Pequeña Minería',
        },
        alianzaPequenaMineriaId: null,
      },
    });

    console.log(
      `📊 Encontradas ${barrasSinAlianza.length} barras sin alianza\n`
    );

    let corregidas = 0;
    let errores = 0;

    for (const barra of barrasSinAlianza) {
      try {
        // Extraer el ID del acta de arrime del identificador
        // Formato: PM-{numeroActa}-{idActaArrime}
        const parts = barra.identificador.split('-');
        const idActaArrime = parseInt(parts[parts.length - 1]);

        if (isNaN(idActaArrime)) {
          console.log(`⚠️  Barra ${barra.id}: No se pudo extraer ID del acta`);
          errores++;
          continue;
        }

        // Buscar el acta de arrime
        const actaArrime = await prisma.actaArrimePequenaMineria.findUnique({
          where: { id: idActaArrime },
        });

        if (!actaArrime) {
          console.log(
            `⚠️  Barra ${barra.id}: Acta ${idActaArrime} no encontrada`
          );
          errores++;
          continue;
        }

        // Actualizar la barra con las relaciones correctas
        await prisma.barraDeOro.update({
          where: { id: barra.id },
          data: {
            alianzaPequenaMineria: {
              connect: { id: actaArrime.alianzaId },
            },
            actaArrimePequenaMineria: {
              connect: { id: actaArrime.id },
            },
          },
        });

        console.log(
          `✅ Barra ${barra.id} corregida (Acta: ${idActaArrime}, Alianza: ${actaArrime.alianzaId})`
        );
        corregidas++;
      } catch (error) {
        console.error(`❌ Error procesando barra ${barra.id}:`, error.message);
        errores++;
      }
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   ✅ Corregidas: ${corregidas}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📊 Total procesadas: ${barrasSinAlianza.length}`);
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBarrasSinAlianza();
