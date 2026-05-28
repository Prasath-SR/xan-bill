import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { SessionUser } from "@/lib/types";

export const AUTH_COOKIE = "xan_bill_session";

// Secret key for JWT. In production, this MUST be set in environment variables.
const secretKey = process.env.JWT_SECRET || "fallback_secret_key_for_development_only";
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSessionToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encodedKey);
}

export async function validateCredentials(staffId: string, password: string) {
  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: {
      staffCode: staffId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      staffCode: true,
      role: true,
      passwordHash: true,
      branchId: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role as UserRole,
    staffCode: user.staffCode,
    branchId: user.branchId,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encodedKey);
    const parsed = payload as unknown as SessionUser;
    
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: parsed.id },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
