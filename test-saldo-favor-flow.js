const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSaldoAFavorFlow() {
  console.log('🧪 Iniciando prueba del flujo de saldos a favor...');

  try {
    // 1. Buscar la alianza de prueba
    console.log('\n📍 Paso 1: Buscando alianza de prueba...');
    const alianza = await prisma.alianza.findFirst({
      where: { nombre: 'Alianza Prueba Completa' },
      include: {
        actasFundicion: {
          include: {
            actasCobranza: {
              where: { estado: 'PENDIENTE' },
            },
          },
        },
      },
    });

    if (!alianza) {
      console.log(
        '❌ No se encontró la alianza de prueba. Ejecuta primero test-complete-flow.js'
      );
      return;
    }

    console.log('✅ Alianza encontrada:', alianza.nombre);
    console.log(
      '   💰 Saldo deuda actual:',
      alianza.saldoDeuda.toFixed(2),
      'gr'
    );

    // Obtener cobranzas pendientes de todas las actas de fundición
    const cobranzasPendientes = alianza.actasFundicion.flatMap(
      (af) => af.actasCobranza
    );
    console.log('   📋 Cobranzas pendientes:', cobranzasPendientes.length);

    // 2. Crear un acta de arrime con excedente
    console.log('\n🔄 Paso 2: Creando acta de arrime con excedente...');
    const actaArrime = await prisma.actaArrime.create({
      data: {
        sectorId: alianza.sectorId,
        alianzaId: alianza.id,
        fecha: new Date(),
        nomenclatura: 'CVM/GGP/GPM/SP/0002/08/2024',
        totalBruto: 1500.0,
        totalFino: 1350.0,
        barras: {
          create: [
            {
              numeroBarra: 1,
              precintoBarra: 'PR003',
              totalBruto: 800.0,
              promedioLey: 900.0,
              totalFino: 720.0,
            },
            {
              numeroBarra: 2,
              precintoBarra: 'PR004',
              totalBruto: 700.0,
              promedioLey: 900.0,
              totalFino: 630.0,
            },
          ],
        },
      },
      include: { barras: true },
    });

    console.log('✅ Acta de arrime creada:', actaArrime.nomenclatura);
    console.log('   📊 Total fino:', actaArrime.totalFino.toFixed(2), 'gr');

    // 3. Simular aplicación de arrime que genera excedente
    console.log('\n💰 Paso 3: Aplicando arrime y generando saldo a favor...');

    // Aplicar parte del arrime a la cobranza pendiente
    const cobranzaPendiente = cobranzasPendientes[0];
    const montoAAplicar = Math.min(
      actaArrime.totalFino,
      cobranzaPendiente.saldoActual
    );
    const excedente = actaArrime.totalFino - montoAAplicar;

    console.log(
      '   🎯 Cobranza pendiente:',
      cobranzaPendiente.correlativo,
      '-',
      cobranzaPendiente.saldoActual.toFixed(2),
      'gr'
    );
    console.log('   💸 Monto a aplicar:', montoAAplicar.toFixed(2), 'gr');
    console.log('   💎 Excedente generado:', excedente.toFixed(2), 'gr');

    // Actualizar cobranza
    await prisma.actaCobranza.update({
      where: { id: cobranzaPendiente.id },
      data: {
        saldoActual: cobranzaPendiente.saldoActual - montoAAplicar,
        estado:
          cobranzaPendiente.saldoActual - montoAAplicar <= 0
            ? 'SALDADA'
            : 'PENDIENTE',
      },
    });

    // Actualizar saldo de alianza
    const nuevoSaldoDeuda = Math.max(0, alianza.saldoDeuda - montoAAplicar);
    await prisma.alianza.update({
      where: { id: alianza.id },
      data: { saldoDeuda: nuevoSaldoDeuda },
    });

    // Crear saldo a favor si hay excedente
    let saldoAFavor = null;
    if (excedente > 0) {
      saldoAFavor = await prisma.saldoAFavor.create({
        data: {
          alianzaId: alianza.id,
          actaArrimeId: actaArrime.id,
          monto: excedente,
          montoDisponible: excedente,
          estado: 'DISPONIBLE',
          descripcion: `Excedente del arrime ${actaArrime.nomenclatura}`,
        },
      });
      console.log(
        '✅ Saldo a favor creado:',
        saldoAFavor.id,
        '-',
        excedente.toFixed(2),
        'gr'
      );
    }

    // 4. Crear una segunda cobranza para probar la aplicación
    console.log('\n📋 Paso 4: Creando segunda cobranza para prueba...');
    const segundaCobranza = await prisma.actaCobranza.create({
      data: {
        actaFundicionId: 2, // Usar la misma acta de fundición
        correlativo: 'CVM/GGP/GPM/SP/0002/08/2024',
        hora: new Date(),
        totalCobranza: 300.0,
        saldoActual: 300.0,
        estado: 'PENDIENTE',
      },
    });

    // Actualizar saldo de deuda de la alianza
    await prisma.alianza.update({
      where: { id: alianza.id },
      data: { saldoDeuda: nuevoSaldoDeuda + 300.0 },
    });

    console.log(
      '✅ Segunda cobranza creada:',
      segundaCobranza.correlativo,
      '-',
      segundaCobranza.totalCobranza.toFixed(2),
      'gr'
    );

    // 5. Probar aplicación de saldo a favor
    if (saldoAFavor && excedente > 0) {
      console.log('\n🎯 Paso 5: Probando aplicación de saldo a favor...');

      const montoAplicarSaldo = Math.min(
        200.0,
        excedente,
        segundaCobranza.saldoActual
      );

      console.log(
        '   💰 Aplicando',
        montoAplicarSaldo.toFixed(2),
        'gr del saldo a favor'
      );
      console.log('   📋 A la cobranza:', segundaCobranza.correlativo);

      // Simular la aplicación usando el endpoint
      const aplicacion = await prisma.aplicacionSaldoAFavor.create({
        data: {
          saldoAFavorId: saldoAFavor.id,
          actaCobranzaId: segundaCobranza.id,
          montoAplicado: montoAplicarSaldo,
          descripcion: `Aplicación de saldo a favor (${actaArrime.nomenclatura}) a cobranza ${segundaCobranza.correlativo}`,
        },
      });

      // Actualizar saldo a favor
      const nuevoMontoDisponible =
        saldoAFavor.montoDisponible - montoAplicarSaldo;
      await prisma.saldoAFavor.update({
        where: { id: saldoAFavor.id },
        data: {
          montoDisponible: nuevoMontoDisponible,
          estado: nuevoMontoDisponible <= 0 ? 'AGOTADO' : 'PARCIALMENTE_USADO',
          fechaUso: new Date(),
        },
      });

      // Actualizar cobranza
      const nuevoSaldoCobranza =
        segundaCobranza.saldoActual - montoAplicarSaldo;
      await prisma.actaCobranza.update({
        where: { id: segundaCobranza.id },
        data: {
          saldoActual: nuevoSaldoCobranza,
          estado: nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE',
        },
      });

      console.log('✅ Aplicación exitosa!');
      console.log('   🎯 Aplicación ID:', aplicacion.id);
      console.log(
        '   💰 Nuevo saldo disponible:',
        nuevoMontoDisponible.toFixed(2),
        'gr'
      );
      console.log(
        '   📋 Nuevo saldo cobranza:',
        nuevoSaldoCobranza.toFixed(2),
        'gr'
      );
    }

    // 6. Mostrar estado final
    console.log('\n📊 Estado final:');
    const alianzaFinal = await prisma.alianza.findUnique({
      where: { id: alianza.id },
      include: {
        actasFundicion: {
          include: {
            actasCobranza: true,
          },
        },
        saldosAFavor: {
          include: {
            aplicaciones: {
              include: { actaCobranza: true },
            },
            actaArrime: true,
          },
        },
      },
    });

    console.log('   🏢 Alianza:', alianzaFinal.nombre);
    console.log(
      '   💰 Saldo deuda final:',
      alianzaFinal.saldoDeuda.toFixed(2),
      'gr'
    );
    const todasCobranzas = alianzaFinal.actasFundicion.flatMap(
      (af) => af.actasCobranza
    );
    console.log('   📋 Cobranzas totales:', todasCobranzas.length);
    console.log('   💎 Saldos a favor:', alianzaFinal.saldosAFavor.length);

    alianzaFinal.saldosAFavor.forEach((saldo, index) => {
      console.log(
        `     ${index + 1}. ${
          saldo.actaArrime?.nomenclatura
        } - ${saldo.montoDisponible.toFixed(2)}/${saldo.monto.toFixed(2)} gr (${
          saldo.estado
        })`
      );
      saldo.aplicaciones.forEach((app, appIndex) => {
        console.log(
          `        Aplicación ${appIndex + 1}: ${app.montoAplicado.toFixed(
            2
          )} gr → ${app.actaCobranza.correlativo}`
        );
      });
    });

    console.log(
      '\n🎉 ¡Prueba del flujo de saldos a favor completada exitosamente!'
    );
    console.log('\n📝 Ahora puedes probar en el frontend:');
    console.log('   1. Ve a "Gestión de Deudas"');
    console.log('   2. Selecciona "Alianza Prueba Completa"');
    console.log('   3. Verifica los saldos a favor en la tabla');
    console.log('   4. Usa el botón "Aplicar" para aplicar saldos a cobranzas');
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testSaldoAFavorFlow();
