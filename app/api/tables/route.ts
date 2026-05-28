import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { getActiveBranchId } from "@/lib/server-data";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const body = await request.json() as { name: string, capacity: number };

  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.restaurantTable.findUnique({ where: { name: body.name } });
  if (existing) {
    return NextResponse.json({ error: "Table name must be unique" }, { status: 400 });
  }

  const table = await prisma.restaurantTable.create({
    data: {
      name: body.name,
      capacity: body.capacity || 4,
      status: "AVAILABLE",
      branchId: await getActiveBranchId(),
    }
  });

  return NextResponse.json({ ok: true, table });
}
