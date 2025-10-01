const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sectores = [
    'EL MANTECO',
    'UPATA',
    'GUASIPATI',
    'EL CALLAO 1',
    'EL CALLAO 2',
    'TUMEREMO',
    'EL DORADO',
    'KM 27',
    'KM 88',
  ];

  for (const nombre of sectores) {
    await prisma.sector.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log('Sectores insertados');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
