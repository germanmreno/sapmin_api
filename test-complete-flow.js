const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteFlow() {
  console.log('🚀 Iniciando prueba del flujo completo...');

  try {
    // 1. Crear sector si no existe
    console.log('\n📍 Paso 1: Verificando/Creando sector...');
    let sector = await prisma.sector.findFirst({
      where: { nombre: 'Sector Prueba' },
    });

    if (!sector) {
      sector = await prisma.sector.create({
        data: {
          nombre: 'Sector Prueba',
        },
      });
      console.log('✅ Sector creado:', sector.nombre);
    } else {
      console.log('✅ Sector encontrado:', sector.nombre);
    }

    // 2. Crear alianza
    console.log('\n🏢 Paso 2: Creando alianza...');
    const alianza = await prisma.alianza.create({
      data: {
        nombre: 'Alianza Prueba Completa',
        rif: 'J-12345678-9',
        fechaConstitucion: new Date('2020-01-01'),
        representanteLegal: 'Juan Pérez',
        estatus: 'ACTIVA',
        poseenMinas: true,
        numeroLineas: 2,
        direccionPlanta: 'Calle Principal, Ciudad Bolívar',
        correoEmpresa: 'contacto@alianzaprueba.com',
        telefonoEmpresa: '+58-414-1234567',
        capacidadInstalada: '500 kg/día',
        capacidadOperativa: '400 kg/día',
        sectorId: sector.id,
        saldoDeuda: 0,
      },
    });
    console.log('✅ Alianza creada:', alianza.nombre, '- ID:', alianza.id);

    // 3. Crear funcionario
    console.log('\n👤 Paso 3: Creando funcionario...');
    const funcionario = await prisma.funcionario.create({
      data: {
        nombres: 'Carlos',
        apellidos: 'Rodríguez',
        tipoCedula: 'V',
        cedula: 12345678,
        correo: 'carlos.rodriguez@cvm.gob.ve',
        telefono: '+58-412-9876543',
        estatus: 'ACTIVO',
        sectorId: sector.id,
        alianzaId: alianza.id,
      },
    });
    console.log(
      '✅ Funcionario creado:',
      funcionario.nombres,
      funcionario.apellidos,
      '- ID:',
      funcionario.id
    );

    // 4. Crear acta de fundición
    console.log('\n🔥 Paso 4: Creando acta de fundición...');
    const actaFundicion = await prisma.actaFundicion.create({
      data: {
        sectorId: sector.id,
        alianzaId: alianza.id,
        rifAlianza: alianza.rif,
        fechaFundicion: new Date(),
        numeroActa: 'CVM/GGP/GPM/SP/0001/08/2024',
        barras: {
          create: [
            {
              numeroBarra: 1,
              precintoBarra: 'PR001',
              totalBruto: 1000.5,
              promedioLey: 850.75,
              totalFino: 851.18,
            },
            {
              numeroBarra: 2,
              precintoBarra: 'PR002',
              totalBruto: 750.25,
              promedioLey: 920.3,
              totalFino: 690.48,
            },
          ],
        },
      },
      include: {
        barras: true,
      },
    });
    console.log(
      '✅ Acta de fundición creada:',
      actaFundicion.numeroActa,
      '- ID:',
      actaFundicion.id
    );
    console.log('   📊 Barras creadas:', actaFundicion.barras.length);

    // Calcular totales
    const totalBruto = actaFundicion.barras.reduce(
      (sum, b) => sum + b.totalBruto,
      0
    );
    const totalCobranza = totalBruto * 0.35; // 35% del peso bruto
    console.log('   💰 Total bruto:', totalBruto.toFixed(2), 'gr');
    console.log('   💰 Cobranza generada:', totalCobranza.toFixed(2), 'gr');

    // 5. Generar cobranza automáticamente
    console.log('\n💳 Paso 5: Generando cobranza automática...');
    const correlativo = `CVM/GGP/GPM/SP/0001/08/2024`;
    const actaCobranza = await prisma.actaCobranza.create({
      data: {
        actaFundicion: { connect: { id: actaFundicion.id } },
        correlativo,
        hora: new Date(),
        totalCobranza,
        saldoActual: totalCobranza,
        estado: 'PENDIENTE',
      },
    });

    // Actualizar saldo de deuda de la alianza
    await prisma.alianza.update({
      where: { id: alianza.id },
      data: { saldoDeuda: totalCobranza },
    });

    // Registrar movimiento
    await prisma.historialMovimientoSaldo.create({
      data: {
        alianza: { connect: { id: alianza.id } },
        actaCobranza: { connect: { id: actaCobranza.id } },
        tipo: 'COBRANZA_GENERADA',
        monto: totalCobranza,
        saldoAntes: 0,
        saldoDespues: totalCobranza,
        descripcion: `Cobranza generada del acta de fundición ${actaFundicion.numeroActa}`,
      },
    });

    console.log(
      '✅ Cobranza creada:',
      actaCobranza.correlativo,
      '- Monto:',
      totalCobranza.toFixed(2),
      'gr'
    );

    // 6. Mostrar estado actual
    console.log('\n📊 Estado actual de la alianza:');
    const alianzaActualizada = await prisma.alianza.findUnique({
      where: { id: alianza.id },
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

    console.log('   🏢 Alianza:', alianzaActualizada.nombre);
    console.log(
      '   💰 Saldo deuda:',
      alianzaActualizada.saldoDeuda.toFixed(2),
      'gr'
    );
    console.log(
      '   📋 Actas fundición:',
      alianzaActualizada.actasFundicion.length
    );
    console.log(
      '   💳 Cobranzas pendientes:',
      alianzaActualizada.actasFundicion.reduce(
        (sum, af) => sum + af.actasCobranza.length,
        0
      )
    );

    console.log('\n🎉 ¡Flujo inicial completado exitosamente!');
    console.log('\n📝 Próximos pasos manuales:');
    console.log('   1. Crear acta de arrime desde el frontend');
    console.log('   2. Seleccionar cobranzas a pagar');
    console.log('   3. Gestionar saldos a favor');
    console.log('\n🌐 Datos para usar en el frontend:');
    console.log('   - Sector ID:', sector.id, '- Nombre:', sector.nombre);
    console.log('   - Alianza ID:', alianza.id, '- Nombre:', alianza.nombre);
    console.log(
      '   - Funcionario ID:',
      funcionario.id,
      '- Nombre:',
      funcionario.nombres,
      funcionario.apellidos
    );
    console.log(
      '   - Acta Fundición ID:',
      actaFundicion.id,
      '- Número:',
      actaFundicion.numeroActa
    );
    console.log(
      '   - Cobranza ID:',
      actaCobranza.id,
      '- Correlativo:',
      actaCobranza.correlativo
    );
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testCompleteFlow();
