import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;
  const body = await request.json();

  if (!body.name || !body.staffCode || !body.role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const updateData: any = {
    name: body.name.trim(),
    staffCode: body.staffCode.trim(),
    email: body.email?.trim() || null,
    role: body.role as UserRole,
    isActive: body.isActive !== undefined ? body.isActive : true,
  };

  if (body.password && body.password.trim() !== "") {
    updateData.passwordHash = bcrypt.hashSync(body.password, 10);
  }

  try {
    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Staff code or email already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update staff member." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;

  try {
    // Soft delete to prevent breaking orders
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete staff member." }, { status: 500 });
  }
}
