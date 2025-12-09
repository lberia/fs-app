import type { BunRequest } from "bun";
import { checkAuth } from "../utils/auth";
import { FSProvider } from "../services/fs.provider";

export async function listDirectory(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path } = (await req.body?.json()) || {};
  const fsProvider = new FSProvider(user.id);
  const nodes = await fsProvider.listDirectory(path);
  console.log(nodes.map((v) => v.createDate));
  return Response.json(nodes);
}

export async function createDirectory(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path } = (await req.body?.json()) || {};
  if (!path) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.createDirectory(path);
  return new Response();
}

export async function deleteDirectory(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path } = (await req.body?.json()) || {};
  if (!path) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.deleteDirectory(path);
  return new Response();
}

export async function moveDirectory(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path, newPath } = (await req.body?.json()) || {};
  if (!path || !newPath) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.moveDirectory(path, newPath);
  return new Response();
}

export async function copyDirectory(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path, newPath } = (await req.body?.json()) || {};
  if (!path || !newPath) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.copyDirectory(path, newPath);
  return new Response();
}
