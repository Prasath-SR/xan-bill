import { NextResponse } from "next/server";
import { getOrdersForApi } from "@/lib/server-data";

export async function GET() {
  return NextResponse.json({ orders: await getOrdersForApi() });
}
