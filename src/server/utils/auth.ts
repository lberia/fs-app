import type { BunRequest } from "bun";
import { users, type PublicUser } from "../models/user.model";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const hashPassword = async (password: string): Promise<string> => {
  return Bun.password.hash(password, "argon2id");
};

export const verifyHash = (password: string, hash: string): Promise<boolean> =>
  Bun.password.verify(hash, password, "argon2id");

export async function checkAuth(
  request: BunRequest
): Promise<PublicUser | null> {
  const cookie = request.cookies.get("auth");
  if (!cookie) return null;
  const token = await verifyToken<PublicUser>(cookie);
  if (!token) return null;
  const [user] = await db.select().from(users).where(eq(users.id, token.id));
  return user || null;
}

// const secret = new TextEncoder().encode(Bun.randomUUIDv7());
const secret = new TextEncoder().encode("temporarysecret");

export function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h") // Token expires in 2 hours
    .sign(secret);
}

export async function verifyToken<T = JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify<T>(token, secret);
    return payload;
  } catch (error) {
    // Handle invalid or expired tokens
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function setAuthCookie(req: BunRequest, content: any) {
  const payload: JWTPayload = { ...content };
  const token = await createToken(payload);
  req.cookies.set("auth", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
    secure: true,
  });
}
