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
    available: boolean;
    categoryId: string;
    description?: string;
    enabled: boolean;
    gstRate: number;
    image?: string;
    isCombo: boolean;
    name: string;
    price: number;
    parcelPrice?: number;
  };

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      price: body.price,
      parcelPrice: body.parcelPrice ?? null,
      gstRate: body.gstRate,
      isAvailable: body.available,
      isEnabled: body.enabled,
      isCombo: body.isCombo,
      categoryId: body.categoryId,
      imageUrl: body.image?.trim() || null,
    },
    include: {
      category: true,
    },
  });

  return NextResponse.json({
    item: {
      id: item.id,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      name: item.name,
      description: item.description ?? "",
      price: Number(item.price),
      parcelPrice: item.parcelPrice ? Number(item.parcelPrice) : undefined,
      gstRate: Number(item.gstRate),
      enabled: item.isEnabled,
      available: item.isAvailable,
      isCombo: item.isCombo,
      image: item.imageUrl ?? "",
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const { id } = await context.params;

  try {
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete item because it is part of existing orders. Please disable it instead." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An error occurred while trying to delete the item." },
      { status: 500 }
    );
  }
}
