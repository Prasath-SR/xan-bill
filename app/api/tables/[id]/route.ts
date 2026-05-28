import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;

  const openOrder = await prisma.order.findFirst({
    where: { tableId: id, status: "OPEN" }
  });

  if (openOrder) {
    return NextResponse.json({ error: "Cannot delete table with an open order." }, { status: 400 });
  }

  await prisma.restaurantTable.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
