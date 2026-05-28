import { DiningMode, OrderStatus, PaymentMethod, TableStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { getActiveBranchId } from "@/lib/server-data";

function buildOrderNumber() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}



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
    customerName?: string;
    discount: number;
    diningMode: DiningMode;
    items: Array<{
      name?: string;
      gstRate: number;
      id: string;
      price: number;
      quantity: number;
    }>;
    notes?: string;
    paymentMethod?: PaymentMethod;

    tableName?: string;
  };

  if (!body.items?.length) {
    return NextResponse.json({ error: "Add at least one item." }, { status: 400 });
  }

  const table =
    body.diningMode === "DINE_IN" && body.tableName
      ? await prisma.restaurantTable.findFirst({ where: { name: body.tableName } })
      : null;

  const grandTotalBeforeDiscount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalAmount = body.items.reduce((sum, item) => {
    const total = item.price * item.quantity;
    return sum + (total / (1 + item.gstRate / 100));
  }, 0);
  const taxAmount = body.items.reduce((sum, item) => {
    const total = item.price * item.quantity;
    const basePrice = total / (1 + item.gstRate / 100);
    return sum + (total - basePrice);
  }, 0);
  const discountAmount = Number(body.discount || 0);
  const totalAmount = grandTotalBeforeDiscount - discountAmount;
  const invoiceNumber = buildInvoiceNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber: buildOrderNumber(),
      diningMode: body.diningMode,
      status: OrderStatus.BILLED,
      customerName: body.customerName?.trim() || null,
      notes: body.notes?.trim() || null,
      discountAmount,
      taxAmount,
      subtotalAmount,
      totalAmount,
      tableId: table?.id ?? null,
      branchId: await getActiveBranchId(),
      createdById: sessionUser.id,
      items: {
        create: body.items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          taxRate: item.gstRate,
          totalAmount: item.price * item.quantity,
        })),
      },

      bill: invoiceNumber
        ? {
            create: {
              invoiceNumber,
              printedAt: new Date(),
            },
          }
        : undefined,
      payments:
        body.paymentMethod
          ? {
              create: {
                userId: sessionUser.id,
                method: body.paymentMethod,
                amount: totalAmount,
              },
            }
          : undefined,
    },
    include: {
      bill: true,
    },
  });

  if (table?.id && body.diningMode === "DINE_IN") {
    await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { status: TableStatus.OCCUPIED },
    });
  }

  return NextResponse.json({
    ok: true,
    billedAt: order.createdAt,
    invoiceNumber: order.bill?.invoiceNumber ?? null,
    orderNumber: order.orderNumber,

    totalAmount,
  });
}
