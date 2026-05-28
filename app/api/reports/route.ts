import { NextResponse } from "next/server";
import { getReportsPageData } from "@/lib/server-data";

export async function GET() {
  const { reports } = await getReportsPageData();
  return NextResponse.json({ reports });
}
