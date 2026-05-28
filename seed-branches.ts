import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create Main Branch
  let mainBranch = await prisma.branch.findUnique({ where: { code: 'MAIN' } });
  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: 'MAIN',
        address: '',
      }
    });
    console.log('Created Main Branch');
  }

  // Create Branch 2
  let branch2 = await prisma.branch.findUnique({ where: { code: 'BRANCH2' } });
  if (!branch2) {
    branch2 = await prisma.branch.create({
      data: {
        name: 'Second Branch',
        code: 'BRANCH2',
        address: '',
      }
    });
    console.log('Created Branch 2');
  }

  // Assign existing tables to Main Branch
  await prisma.restaurantTable.updateMany({
    where: { branchId: null },
    data: { branchId: mainBranch.id }
  });

  // // Assign existing orders to Main Branch
  // await prisma.order.updateMany({
  //   where: { branchId: null },
  //   data: { branchId: mainBranch.id }
  // });

  // Assign existing users to Main Branch
  await prisma.user.updateMany({
    where: { branchId: null },
    data: { branchId: mainBranch.id }
  });

  console.log('Successfully seeded branches and assigned existing records to Main Branch.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
