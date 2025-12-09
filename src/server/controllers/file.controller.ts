import type { BunRequest } from "bun";
import { checkAuth } from "../utils/auth.ts";
import { FSService } from "../services/fs.service.ts";
import { FSProvider } from "../services/fs.provider.ts";

export async function uploadFile(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const formData = await req.formData();
  const path = formData.get("path") as string | undefined;
  if (!path) return new Response(undefined, { status: 400 });
  const mimeType = formData.get("mimeType") as string | undefined;
  const size = formData.get("size") as string | undefined;
  const file = formData.get("file") as Blob;
  const fsProvider = new FSProvider(user.id);
  await fsProvider.writeFile(
    path || "/",
    file,
    typeof size === "string" ? parseInt(size) : undefined,
    mimeType
  );
  return Response.json(user);
}

export async function deleteFile(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path } = (await req.body?.json()) || {};
  if (!path) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.deleteFile(path);
  return new Response();
}

export async function viewFile(
  req: BunRequest<"/api/file/:id">
): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return new Response("Invalid id", { status: 400 });
  const fsProvider = new FSProvider(user.id);
  const file = await fsProvider.getFileById(id);
  if (!file) return new Response(undefined, { status: 404 });

  return new Response(FSService.getStream(file.uri), {
    headers: {
      "content-disposition": `inline; filename=${file.name}; name=${file.name}`,
      ...(file.mimeType ? { "Content-Type": file.mimeType } : {}),
    },
  });
}

export async function moveFile(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path, newPath } = (await req.body?.json()) || {};
  if (!path || !newPath) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.moveFile(path, newPath);
  return new Response();
}

export async function copyFile(req: BunRequest): Promise<Response> {
  const user = await checkAuth(req);
  if (!user) return new Response(undefined, { status: 401 });
  const { path, newPath } = (await req.body?.json()) || {};
  if (!path || !newPath) return new Response(undefined, { status: 400 });
  const fsProvider = new FSProvider(user.id);
  await fsProvider.copyFile(path, newPath);
  return new Response();
}
