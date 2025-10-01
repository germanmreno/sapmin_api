const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFuncionario() {
  const funcionario = await prisma.funcionario.create({
    data: {
      nombres: 'LUIS',
      apellidos: 'MATA',
      tipoCedula: 'V',
      cedula: 20957157,
      correo: 'luis.mata@cvm.gob.ve',
      telefono: '+58-422-1001010',
      estatus: 'ACTIVO',
      sectorId: 3,
      alianzaId: 10,
    },
  });
  console.log(
    `✅ Funcionario creado: ${funcionario.nombres} ${funcionario.apellidos} (ID: ${funcionario.id})`
  );
}

createFuncionario();
