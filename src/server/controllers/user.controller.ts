import type { BunRequest } from "bun";
import {
  checkAuth,
  hashPassword,
  setAuthCookie,
  verifyHash,
} from "../utils/auth.ts";
import { db } from "../db";
import { users } from "../models/user.model.ts";
import { eq } from "drizzle-orm";

export async function registerUser(req: BunRequest): Promise<Response> {
  try {
    const { email, password, name = "" } = await req.body?.json();

    if (!email || !password)
      return new Response("Invalid email and password", { status: 400 });

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({ id: users.id, name: users.name, email: users.email });
    if (!user) throw new Error();
    await setAuthCookie(req, user);
    return Response.json(user);
  } catch (err) {
    console.log("err -> ", err);
    if (
      err instanceof Error &&
      "code" in err &&
      err.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return new Response("User with that email address already exists", {
        status: 400,
      });
    }
    return new Response(undefined, { status: 500 });
  }
}

export async function loginUser(req: BunRequest): Promise<Response> {
  try {
    const { email, password } = await req.body?.json();

    if (!email || !password)
      return new Response("Invalid email and password", { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !(await verifyHash(user.passwordHash, password)))
      return new Response("Wrong email or password", { status: 401 });

    await setAuthCookie(req, user);

    return Response.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.log("err -> ", err);
    return new Response(undefined, { status: 500 });
  }
}

export async function identifyUser(req: BunRequest): Promise<Response> {
  try {
    const user = await checkAuth(req);
    if (!user) return new Response(undefined, { status: 401 });

    await setAuthCookie(req, user);

    return Response.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.log("err -> ", err);
    return new Response(undefined, { status: 500 });
  }
}

export async function logoutUser(req: BunRequest): Promise<Response> {
  try {
    const user = await checkAuth(req);
    if (!user) return new Response(undefined, { status: 401 });

    req.cookies.delete("auth");

    return new Response();
  } catch (err) {
    console.log("err -> ", err);
    return new Response(undefined, { status: 500 });
  }
}
