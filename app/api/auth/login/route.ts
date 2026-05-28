import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, createSessionToken, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string; staffId?: string };
  const staffId = body.staffId?.trim() ?? "";
  const password = body.password ?? "";
  const user = await validateCredentials(staffId, password);

  if (!user) {
    return NextResponse.json({ error: "Invalid staff ID or password." }, { status: 401 });
  }

  const token = await createSessionToken(user);
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
