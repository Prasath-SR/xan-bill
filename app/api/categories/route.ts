import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
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

    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      category: {
        ...category,
        itemCount: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
