import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json(branches);
}
