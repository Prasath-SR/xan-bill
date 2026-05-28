import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, getSessionUser, createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { branchId } = (await request.json()) as { branchId: string };
  if (!branchId) {
    return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
  }

  const updatedUser = { ...sessionUser, branchId };
  const token = await createSessionToken(updatedUser);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
