import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function todayAt(hour, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function daysBack(days, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  // await prisma.companyProfile.deleteMany();
  // await prisma.attendance.deleteMany();
  // await prisma.payment.deleteMany();
  // await prisma.orderItem.deleteMany();

  // await prisma.bill.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.stockTransaction.deleteMany();
  // await prisma.purchase.deleteMany();
  // await prisma.inventoryItem.deleteMany();
  // await prisma.menuItem.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.restaurantTable.deleteMany();
  // await prisma.supplier.deleteMany();
  // await prisma.user.deleteMany();

  const [admin, cashier] = await Promise.all([
    prisma.user.create({
      data: {
        staffCode: "admin1",
        name: "Paranthaman L",
        email: "paranthamanl2004@gmail.com",
        passwordHash: hashPassword("Paranthaman@2004"),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        staffCode: "admin2",
        name: "Vasu M",
        email: "vasuvasu3244@gmail.com",
        passwordHash: hashPassword("Vasu@1612"),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        staffCode: "admin3",
        name: "Prasath S R",
        email: "prasathsr007@gmail.com",
        passwordHash: hashPassword("Prasath"),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        staffCode: "cashier",
        name: "Cashier 01",
        email: "cashier01@gmail.com",
        passwordHash: hashPassword("cashier"),
        role: "CASHIER",
      },
    }),
  ]);

  await prisma.companyProfile.create({
    data: {
      code: "default",
      companyName: "Kongu Parotta Stall",
      address: "1 Sathya Main Road\nErode - 638004",
      gstin: "33ABCDE1234F1Z5",
      fssai: "12422022001234",
      phone: "+91 9876543210",
      email: "",
      invoiceTitle: "TAX INVOICE",
    },
  });


  
  const tableData = [];
  for (let i = 1; i <= 20; i++) {
    tableData.push({
      name: `T${i}`,
      capacity: i <= 10 ? 4 : 2,
      zone: i <= 10 ? "Main Dining" : "Patio",
      status: "AVAILABLE",
    });
  }
  await prisma.restaurantTable.createMany({ data: tableData });
  console.log("Xan Bill MySQL seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
