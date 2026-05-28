import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { getActiveBranchId } from "@/lib/server-data";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const body = await request.json();

  if (!body.name || !body.staffCode || !body.role || !body.password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const branchId = await getActiveBranchId();

  try {
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        staffCode: body.staffCode.trim(),
        email: body.email?.trim() || null,
        passwordHash: bcrypt.hashSync(body.password, 10),
        role: body.role as UserRole,
        branchId,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, id: user.id });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Staff code or email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create staff member." }, { status: 500 });
  }
}
