const fetch = require('node-fetch');

async function testArrimeAPI() {
  console.log('🧪 Probando API de Actas de Arrime...\n');

  try {
    // 1. Obtener sectores
    console.log('1. Obteniendo sectores...');
    const sectoresRes = await fetch('http://localhost:3001/sectores');
    const sectores = await sectoresRes.json();
    console.log(`✅ Sectores encontrados: ${sectores.length}`);

    if (sectores.length === 0) {
      console.log('❌ No hay sectores disponibles');
      return;
    }

    const sector = sectores[0];
    console.log(`   Usando sector: ${sector.nombre} (ID: ${sector.id})`);

    // 2. Obtener alianzas del sector
    console.log('\n2. Obteniendo alianzas...');
    const alianzasRes = await fetch(
      `http://localhost:3001/alianzas?sectorId=${sector.id}`
    );
    const alianzas = await alianzasRes.json();
    console.log(`✅ Alianzas encontradas: ${alianzas.length}`);

    if (alianzas.length === 0) {
      console.log('❌ No hay alianzas disponibles');
      return;
    }

    const alianza = alianzas[0];
    console.log(`   Usando alianza: ${alianza.nombre} (ID: ${alianza.id})`);

    // 3. Verificar saldo actual de la alianza
    console.log('\n3. Verificando saldo de alianza...');
    const saldoRes = await fetch(
      `http://localhost:3001/alianzas/${alianza.id}/saldo`
    );
    const saldoData = await saldoRes.json();
    console.log(`✅ Saldo actual: ${saldoData.saldoDeuda} gr`);
    console.log(`   Cobranzas pendientes: ${saldoData.actasCobranza.length}`);

    // 4. Crear nueva acta de fundición para generar deuda
    console.log('\n4. Creando nueva acta de fundición...');
    const nuevaActaFundicion = {
      sectorId: sector.id,
      alianzaId: alianza.id,
      rifAlianza: alianza.rif,
      fechaFundicion: new Date().toISOString(),
      numeroActa: `CVM/GGP/GPM/ELCALLAO1/TEST/${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()}`,
      barras: [
        {
          numeroBarra: 1,
          precintoBarra: 'TEST-001',
          pesoBruto: 800.0,
          promedioLey: 900.0,
          pesoFino: 720.0,
        },
      ],
    };

    const actaFundicionRes = await fetch(
      'http://localhost:3001/actas-fundicion',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaActaFundicion),
      }
    );

    if (!actaFundicionRes.ok) {
      const error = await actaFundicionRes.text();
      console.log('❌ Error creando acta de fundición:', error);
      return;
    }

    const actaFundicionCreada = await actaFundicionRes.json();
    console.log(
      `✅ Acta de fundición creada: ${actaFundicionCreada.numeroActa}`
    );
    console.log(
      `   Cobranza generada automáticamente: ${actaFundicionCreada.actasCobranza[0].totalCobranza} gr`
    );

    // 5. Crear acta de arrime para pagar la nueva cobranza
    console.log('\n5. Creando acta de arrime...');
    const nuevaActaArrime = {
      sectorId: sector.id,
      alianzaId: alianza.id,
      fecha: new Date().toISOString(),
      piezas: 1,
      pesoBruto: 150.0, // Pago parcial
      tipoLey: 850,
      pesoFino: 127.5,
      observaciones: 'Pago de prueba via API',
    };

    const actaArrimeRes = await fetch('http://localhost:3001/actas-arrime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaActaArrime),
    });

    if (!actaArrimeRes.ok) {
      const error = await actaArrimeRes.text();
      console.log('❌ Error creando acta de arrime:', error);
      return;
    }

    const result = await actaArrimeRes.json();
    console.log(`✅ Acta de arrime creada: ${result.acta.nomenclatura}`);
    console.log(`   Peso bruto: ${result.acta.pesoBruto} gr`);
    console.log(`   Detalles de aplicación:`);

    result.detalles.forEach((detalle) => {
      console.log(
        `      → Cobranza ${detalle.actaCobranzaId}: ${detalle.montoAplicado} gr aplicados`
      );
    });

    // 6. Verificar saldo final
    console.log('\n6. Verificando saldo final...');
    const saldoFinalRes = await fetch(
      `http://localhost:3001/alianzas/${alianza.id}/saldo`
    );
    const saldoFinal = await saldoFinalRes.json();
    console.log(`✅ Saldo final: ${saldoFinal.saldoDeuda} gr`);

    console.log('\n🎉 ¡Prueba de API completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testArrimeAPI();
