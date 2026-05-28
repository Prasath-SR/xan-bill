import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { getCompanyProfile } from "@/lib/server-data";

export async function GET() {
  return NextResponse.json(await getCompanyProfile());
}

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();
  const body = (await request.json()) as {
    address: string;
    companyName: string;
    email: string;
    fssai: string;
    gstin: string;
    invoiceTitle: string;
    logoUrl: string;
    phone: string;
  };

  const profile = await prisma.companyProfile.upsert({
    where: { code: "default" },
    update: {
      companyName: body.companyName.trim(),
      address: body.address.trim(),
      gstin: body.gstin.trim() || null,
      fssai: body.fssai.trim() || null,
      phone: body.phone.trim() || null,
      email: body.email.trim() || null,
      logoUrl: body.logoUrl.trim() || null,
      invoiceTitle: body.invoiceTitle.trim() || "TAX INVOICE",
    },
    create: {
      code: "default",
      companyName: body.companyName.trim(),
      address: body.address.trim(),
      gstin: body.gstin.trim() || null,
      fssai: body.fssai.trim() || null,
      phone: body.phone.trim() || null,
      email: body.email.trim() || null,
      logoUrl: body.logoUrl.trim() || null,
      invoiceTitle: body.invoiceTitle.trim() || "TAX INVOICE",
    },
  });

  return NextResponse.json({
    companyName: profile.companyName,
    address: profile.address,
    gstin: profile.gstin ?? "",
    fssai: profile.fssai ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    logoUrl: profile.logoUrl ?? "",
    invoiceTitle: profile.invoiceTitle,
  });
}
