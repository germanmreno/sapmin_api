const { cleanupDatabase } = require('./cleanup-database');
const { simulateCompleteProcess } = require('./simulate-complete-process');

async function runFullSimulation() {
  console.log('🚀 INICIANDO SIMULACIÓN COMPLETA DEL SISTEMA\n');
  console.log('='.repeat(60));

  try {
    // Paso 1: Limpiar base de datos
    console.log('PASO 1: LIMPIEZA DE BASE DE DATOS');
    console.log('='.repeat(60));
    await cleanupDatabase();

    console.log('\n' + '='.repeat(60));
    console.log('PASO 2: SIMULACIÓN DEL PROCESO COMPLETO');
    console.log('='.repeat(60));

    // Paso 2: Ejecutar simulación completa
    await simulateCompleteProcess();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SIMULACIÓN COMPLETA FINALIZADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('   1. Inicia tu servidor backend: npm start');
    console.log('   2. Inicia tu frontend: npm run dev');
    console.log('   3. Navega a las secciones para ver los datos simulados');
    console.log('   4. Prueba crear nuevas actas de arrime desde la interfaz');
  } catch (error) {
    console.error('\n💥 ERROR EN LA SIMULACIÓN COMPLETA:', error);
    process.exit(1);
  }
}

// Ejecutar simulación completa
runFullSimulation();
