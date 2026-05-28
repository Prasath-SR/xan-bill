const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: {
      diningMode: 'TAKEAWAY'
    },
    data: {
      diningMode: 'PARCEL'
    }
  });
  console.log(`Updated ${result.count} orders from TAKEAWAY to PARCEL.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
