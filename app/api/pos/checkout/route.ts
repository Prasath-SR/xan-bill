import { OrderStatus, PaymentMethod, TableStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

function buildInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || (sessionUser.role !== "ADMIN" && sessionUser.role !== "CASHIER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const body = (await request.json()) as {
    orderId: string;
    paymentMethod: PaymentMethod;
  };

  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
  });

  if (!order || order.status !== "OPEN") {
    return NextResponse.json({ error: "Invalid order or already billed." }, { status: 400 });
  }

  const invoiceNumber = buildInvoiceNumber();

  const updatedOrder = await prisma.order.update({
    where: { id: body.orderId },
    data: {
      status: OrderStatus.BILLED,
      bill: {
        create: {
          invoiceNumber,
          printedAt: new Date(),
        },
      },
      payments: {
        create: {
          userId: sessionUser.id,
          method: body.paymentMethod,
          amount: order.totalAmount,
        },
      },
    },
    include: {
      bill: true,
    },
  });

  if (order.tableId) {
    const remainingOpenOrders = await prisma.order.count({
      where: { tableId: order.tableId, status: "OPEN" },
    });

    if (remainingOpenOrders === 0) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    billedAt: updatedOrder.createdAt,
    invoiceNumber: updatedOrder.bill?.invoiceNumber,
    orderNumber: updatedOrder.orderNumber,
    totalAmount: Number(updatedOrder.totalAmount),
  });
}
