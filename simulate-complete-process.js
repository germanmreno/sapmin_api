const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateCompleteProcess() {
  console.log('🚀 Iniciando simulación completa del proceso...\n');

  try {
    // 1. CREAR SECTOR (si no existe)
    console.log('1️⃣ Creando/verificando sector...');
    let sector = await prisma.sector.findFirst({
      where: { nombre: 'EL CALLAO 1' },
    });

    if (!sector) {
      sector = await prisma.sector.create({
        data: { nombre: 'EL CALLAO 1' },
      });
      console.log(`✅ Sector creado: ${sector.nombre} (ID: ${sector.id})`);
    } else {
      console.log(`✅ Sector encontrado: ${sector.nombre} (ID: ${sector.id})`);
    }

    // 2. CREAR ALIANZA
    console.log('\n2️⃣ Creando alianza...');
    const alianza = await prisma.alianza.create({
      data: {
        nombre: 'ALIANZA MINERA DEMO',
        rif: 'J-12345678-9',
        fechaConstitucion: new Date('2020-01-15'),
        representanteLegal: 'JUAN PÉREZ',
        estatus: 'ACTIVA',
        poseenMinas: true,
        numeroLineas: 3,
        direccionPlanta: 'Sector El Callao, Estado Bolívar',
        correoEmpresa: 'contacto@alianzademo.com',
        telefonoEmpresa: '+58-414-1234567',
        capacidadInstalada: '500 ton/día',
        capacidadOperativa: '400 ton/día',
        sectorId: sector.id,
        saldoDeuda: 0, // Inicialmente sin deuda
      },
    });
    console.log(`✅ Alianza creada: ${alianza.nombre} (ID: ${alianza.id})`);
    console.log(`   RIF: ${alianza.rif}`);
    console.log(`   Saldo inicial: ${alianza.saldoDeuda} gr`);

    // 3. CREAR FUNCIONARIO
    console.log('\n3️⃣ Creando funcionario...');
    const funcionario = await prisma.funcionario.create({
      data: {
        nombres: 'CARLOS',
        apellidos: 'RODRÍGUEZ',
        tipoCedula: 'V',
        cedula: 12345678,
        correo: 'carlos.rodriguez@cvm.gob.ve',
        telefono: '+58-416-9876543',
        estatus: 'ACTIVO',
        sectorId: sector.id,
        alianzaId: alianza.id,
      },
    });
    console.log(
      `✅ Funcionario creado: ${funcionario.nombres} ${funcionario.apellidos} (ID: ${funcionario.id})`
    );

    // 4. CREAR ACTA DE FUNDICIÓN
    console.log('\n4️⃣ Creando acta de fundición...');
    const actaFundicion = await prisma.actaFundicion.create({
      data: {
        sectorId: sector.id,
        alianzaId: alianza.id,
        rifAlianza: alianza.rif,
        fechaFundicion: new Date(),
        numeroActa: 'CVM/GGP/GPM/ELCALLAO1/0001/08/2025',
        barras: {
          create: [
            {
              numeroBarra: 1,
              precintoBarra: 'PREC-001',
              totalBruto: 1000.5, // 1000.50 gr bruto
              promedioLey: 850.75,
              totalFino: 851.42,
            },
            {
              numeroBarra: 2,
              precintoBarra: 'PREC-002',
              totalBruto: 750.25, // 750.25 gr bruto
              promedioLey: 820.3,
              totalFino: 615.21,
            },
          ],
        },
      },
      include: {
        barras: true,
      },
    });

    const totalBruto = actaFundicion.barras.reduce(
      (sum, b) => sum + b.totalBruto,
      0
    );
    console.log(`✅ Acta de fundición creada: ${actaFundicion.numeroActa}`);
    console.log(`   Total bruto: ${totalBruto} gr`);
    console.log(`   Barras: ${actaFundicion.barras.length}`);

    // 5. GENERAR ACTA DE COBRANZA AUTOMÁTICAMENTE (35% del bruto)
    console.log('\n5️⃣ Generando acta de cobranza automáticamente...');

    const result = await prisma.$transaction(async (tx) => {
      const porcentajeCobranza = 0.35; // 35%
      const totalCobranza = +(totalBruto * porcentajeCobranza).toFixed(2);

      // Crear acta de cobranza
      const actaCobranza = await tx.actaCobranza.create({
        data: {
          actaFundicionId: actaFundicion.id,
          correlativo: 'CVM/GGP/GPM/ELCALLAO1/0001/08/2025',
          hora: new Date(),
          totalCobranza,
          saldoActual: totalCobranza,
          estado: 'PENDIENTE',
        },
      });

      // Actualizar saldo de la alianza
      const alianzaActualizada = await tx.alianza.update({
        where: { id: alianza.id },
        data: { saldoDeuda: totalCobranza },
      });

      // Registrar movimiento
      await tx.historialMovimientoSaldo.create({
        data: {
          alianzaId: alianza.id,
          actaCobranzaId: actaCobranza.id,
          tipo: 'COBRANZA_GENERADA',
          monto: totalCobranza,
          saldoAntes: 0,
          saldoDespues: totalCobranza,
          descripcion: `Cobranza generada del acta ${actaFundicion.numeroActa}`,
        },
      });

      return { actaCobranza, alianzaActualizada };
    });

    console.log(
      `✅ Acta de cobranza generada: ${result.actaCobranza.correlativo}`
    );
    console.log(`   Monto total: ${result.actaCobranza.totalCobranza} gr`);
    console.log(`   Saldo actual: ${result.actaCobranza.saldoActual} gr`);
    console.log(`   Estado: ${result.actaCobranza.estado}`);
    console.log(
      `   Saldo alianza actualizado: ${result.alianzaActualizada.saldoDeuda} gr`
    );

    // 6. SIMULAR MÚLTIPLES ARRIMES (algunos parciales, algunos completos)
    console.log('\n6️⃣ Simulando múltiples arrimes...');

    // PRIMER ARRIME - Pago parcial
    console.log('\n   📦 Primer arrime (pago parcial)...');
    const primerArrime = await prisma.$transaction(async (tx) => {
      const actaArrime = await tx.actaArrime.create({
        data: {
          sectorId: sector.id,
          alianzaId: alianza.id,
          funcionarioId: funcionario.id,
          representanteLegal: alianza.representanteLegal,
          rifAlianza: alianza.rif,
          nomenclatura: 'CVM-GGP-GPM-ELCALLAO1-0001/08/2025',
          fecha: new Date(),
          piezas: 2,
          pesoBruto: 200.0, // Solo 200 gr (parcial)
          tipoLey: '750',
          pesoFino: 150.0,
          observaciones: 'Primer pago parcial',
        },
      });

      // Buscar cobranzas pendientes
      const cobranzasPendientes = await tx.actaCobranza.findMany({
        where: {
          actaFundicion: { alianzaId: alianza.id },
          estado: 'PENDIENTE',
          saldoActual: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
      });

      let montoRestante = 200.0;
      const detalles = [];

      for (const cobranza of cobranzasPendientes) {
        if (montoRestante <= 0) break;

        const montoAplicar = Math.min(montoRestante, cobranza.saldoActual);

        // Crear detalle
        const detalle = await tx.detalleArrimeCobranza.create({
          data: {
            actaArrimeId: actaArrime.id,
            actaCobranzaId: cobranza.id,
            montoAplicado: montoAplicar,
          },
        });

        // Actualizar cobranza
        const nuevoSaldoCobranza = cobranza.saldoActual - montoAplicar;
        await tx.actaCobranza.update({
          where: { id: cobranza.id },
          data: {
            saldoActual: nuevoSaldoCobranza,
            estado: nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE',
          },
        });

        // Actualizar saldo alianza
        const alianzaActual = await tx.alianza.findUnique({
          where: { id: alianza.id },
          select: { saldoDeuda: true },
        });

        const nuevoSaldoAlianza = Math.max(
          0,
          alianzaActual.saldoDeuda - montoAplicar
        );
        await tx.alianza.update({
          where: { id: alianza.id },
          data: { saldoDeuda: nuevoSaldoAlianza },
        });

        // Registrar movimiento
        await tx.historialMovimientoSaldo.create({
          data: {
            alianzaId: alianza.id,
            actaCobranzaId: cobranza.id,
            tipo: 'APLICACION_ARRIME',
            monto: -montoAplicar,
            saldoAntes: alianzaActual.saldoDeuda,
            saldoDespues: nuevoSaldoAlianza,
            descripcion: `Aplicación arrime ${actaArrime.nomenclatura}: ${montoAplicar} gr`,
          },
        });

        detalles.push({
          cobranzaId: cobranza.id,
          montoAplicado: montoAplicar,
          saldoAnterior: cobranza.saldoActual,
          saldoNuevo: nuevoSaldoCobranza,
        });

        montoRestante -= montoAplicar;
      }

      return { actaArrime, detalles };
    });

    console.log(
      `   ✅ Primer arrime creado: ${primerArrime.actaArrime.nomenclatura}`
    );
    console.log(`      Peso bruto: ${primerArrime.actaArrime.pesoBruto} gr`);
    primerArrime.detalles.forEach((d) => {
      console.log(
        `      → Aplicado a cobranza ${d.cobranzaId}: ${d.montoAplicado} gr`
      );
      console.log(
        `        Saldo cobranza: ${d.saldoAnterior} → ${d.saldoNuevo} gr`
      );
    });

    // SEGUNDO ARRIME - Completar el pago
    console.log('\n   📦 Segundo arrime (completar pago)...');
    const segundoArrime = await prisma.$transaction(async (tx) => {
      // Verificar saldo pendiente
      const cobranzaPendiente = await tx.actaCobranza.findFirst({
        where: {
          actaFundicion: { alianzaId: alianza.id },
          estado: 'PENDIENTE',
          saldoActual: { gt: 0 },
        },
      });

      const montoRestante = cobranzaPendiente
        ? cobranzaPendiente.saldoActual
        : 0;
      console.log(`      Saldo pendiente detectado: ${montoRestante} gr`);

      const actaArrime = await tx.actaArrime.create({
        data: {
          sectorId: sector.id,
          alianzaId: alianza.id,
          funcionarioId: funcionario.id,
          representanteLegal: alianza.representanteLegal,
          rifAlianza: alianza.rif,
          nomenclatura: 'CVM-GGP-GPM-ELCALLAO1-0002/08/2025',
          fecha: new Date(),
          piezas: 3,
          pesoBruto: Math.ceil(montoRestante + 50), // Pagar lo que falta + extra
          tipoLey: '800',
          pesoFino: Math.ceil((montoRestante + 50) * 0.8),
          observaciones: 'Pago final + excedente',
        },
      });

      // Aplicar a cobranzas pendientes
      const cobranzasPendientes = await tx.actaCobranza.findMany({
        where: {
          actaFundicion: { alianzaId: alianza.id },
          estado: 'PENDIENTE',
          saldoActual: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
      });

      let montoDisponible = actaArrime.pesoBruto;
      const detalles = [];

      for (const cobranza of cobranzasPendientes) {
        if (montoDisponible <= 0) break;

        const montoAplicar = Math.min(montoDisponible, cobranza.saldoActual);

        // Crear detalle
        await tx.detalleArrimeCobranza.create({
          data: {
            actaArrimeId: actaArrime.id,
            actaCobranzaId: cobranza.id,
            montoAplicado: montoAplicar,
          },
        });

        // Actualizar cobranza
        const nuevoSaldoCobranza = cobranza.saldoActual - montoAplicar;
        await tx.actaCobranza.update({
          where: { id: cobranza.id },
          data: {
            saldoActual: nuevoSaldoCobranza,
            estado: nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE',
          },
        });

        // Actualizar saldo alianza
        const alianzaActual = await tx.alianza.findUnique({
          where: { id: alianza.id },
          select: { saldoDeuda: true },
        });

        const nuevoSaldoAlianza = Math.max(
          0,
          alianzaActual.saldoDeuda - montoAplicar
        );
        await tx.alianza.update({
          where: { id: alianza.id },
          data: { saldoDeuda: nuevoSaldoAlianza },
        });

        // Registrar movimiento
        await tx.historialMovimientoSaldo.create({
          data: {
            alianzaId: alianza.id,
            actaCobranzaId: cobranza.id,
            tipo: 'APLICACION_ARRIME',
            monto: -montoAplicar,
            saldoAntes: alianzaActual.saldoDeuda,
            saldoDespues: nuevoSaldoAlianza,
            descripcion: `Aplicación arrime ${actaArrime.nomenclatura}: ${montoAplicar} gr`,
          },
        });

        detalles.push({
          cobranzaId: cobranza.id,
          montoAplicado: montoAplicar,
          saldoAnterior: cobranza.saldoActual,
          saldoNuevo: nuevoSaldoCobranza,
          estadoFinal: nuevoSaldoCobranza <= 0 ? 'SALDADA' : 'PENDIENTE',
        });

        montoDisponible -= montoAplicar;
      }

      return { actaArrime, detalles, excedente: montoDisponible };
    });

    console.log(
      `   ✅ Segundo arrime creado: ${segundoArrime.actaArrime.nomenclatura}`
    );
    console.log(`      Peso bruto: ${segundoArrime.actaArrime.pesoBruto} gr`);
    segundoArrime.detalles.forEach((d) => {
      console.log(
        `      → Aplicado a cobranza ${d.cobranzaId}: ${d.montoAplicado} gr`
      );
      console.log(
        `        Saldo cobranza: ${d.saldoAnterior} → ${d.saldoNuevo} gr (${d.estadoFinal})`
      );
    });
    if (segundoArrime.excedente > 0) {
      console.log(
        `      💰 Excedente no aplicado: ${segundoArrime.excedente} gr`
      );
    }

    // 7. VERIFICAR ESTADO FINAL
    console.log('\n7️⃣ Verificando estado final...');

    const estadoFinal = await prisma.alianza.findUnique({
      where: { id: alianza.id },
      include: {
        actasFundicion: {
          include: {
            actasCobranza: true,
          },
        },
        actasArrime: {
          include: {
            detallesCobranza: true,
          },
        },
        movimientosSaldo: {
          orderBy: { fecha: 'desc' },
          take: 5,
        },
      },
    });

    console.log(`✅ Estado final de la alianza: ${estadoFinal.nombre}`);
    console.log(`   Saldo de deuda actual: ${estadoFinal.saldoDeuda} gr`);
    console.log(`   Actas de fundición: ${estadoFinal.actasFundicion.length}`);
    console.log(
      `   Actas de cobranza: ${estadoFinal.actasFundicion.reduce(
        (sum, af) => sum + af.actasCobranza.length,
        0
      )}`
    );
    console.log(`   Actas de arrime: ${estadoFinal.actasArrime.length}`);

    // Mostrar resumen de cobranzas
    console.log('\n   📊 Resumen de cobranzas:');
    for (const actaFundicion of estadoFinal.actasFundicion) {
      for (const cobranza of actaFundicion.actasCobranza) {
        console.log(
          `      Cobranza ${cobranza.id}: ${cobranza.totalCobranza} gr → ${cobranza.saldoActual} gr (${cobranza.estado})`
        );
      }
    }

    // Mostrar últimos movimientos
    console.log('\n   📈 Últimos movimientos de saldo:');
    estadoFinal.movimientosSaldo.forEach((mov) => {
      console.log(
        `      ${mov.tipo}: ${mov.monto > 0 ? '+' : ''}${mov.monto} gr (${
          mov.saldoAntes
        } → ${mov.saldoDespues})`
      );
      console.log(`         ${mov.descripcion}`);
    });

    console.log('\n🎉 ¡Simulación completada exitosamente!');
    console.log('\n📋 RESUMEN DEL PROCESO:');
    console.log('   1. ✅ Sector y Alianza creados');
    console.log('   2. ✅ Funcionario asignado');
    console.log('   3. ✅ Acta de fundición registrada');
    console.log(
      '   4. ✅ Acta de cobranza generada automáticamente (35% del bruto)'
    );
    console.log('   5. ✅ Múltiples arrimes aplicados (parcial y completo)');
    console.log('   6. ✅ Saldos actualizados correctamente');
    console.log('   7. ✅ Historial de movimientos registrado');
  } catch (error) {
    console.error('❌ Error en la simulación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la simulación
if (require.main === module) {
  simulateCompleteProcess()
    .then(() => {
      console.log(
        '\n✨ Simulación finalizada. Puedes revisar los datos en tu aplicación.'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { simulateCompleteProcess };
