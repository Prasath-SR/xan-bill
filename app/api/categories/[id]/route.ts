import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;
  const body = (await request.json()) as {
    name: string;
    description?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { name: body.name.trim() },
    });

    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
      },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        itemCount: category._count.menuItems,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;

  try {
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete category because it contains existing menu items. Please remove or reassign the items first." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An error occurred while trying to delete the category." },
      { status: 500 }
    );
  }
}
