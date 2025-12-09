import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { directories, type Directory } from "../models/directory.model";
import type { FSNode } from "./fs.interface";
import type { FSProvider as IFSProvider } from "./fs.interface";
import { files, type File } from "../models/file.model";
import { FSService } from "./fs.service";

export class FSProvider implements IFSProvider {
  public constructor(private userId: number, private workingDirectory = "/") {
    if (!(Number.isInteger(userId) && userId >= 0))
      throw new Error("Valid user id is required");
  }

  private getAbsolutePath(relativePath: string) {
    const outPaths = relativePath.split("/").filter((v) => v === "..").length;
    const cleanRelativePathArr = relativePath
      .split("/")
      .filter((v) => v && v !== "..");
    const cleanWorkingDirArr = this.workingDirectory.split("/").filter(Boolean);
    if (outPaths) cleanWorkingDirArr.splice(-1 * outPaths);
    const joined = cleanWorkingDirArr.concat(cleanRelativePathArr).join("/");
    return joined ? `/${joined}/` : "/";
  }

  private async getDirectory(relativePath: string): Promise<Directory | null> {
    const absolutePath = this.getAbsolutePath(relativePath);
    if (absolutePath === "/") return null;
    const splitPath = absolutePath.split("/").filter(Boolean);
    let dir: Directory | undefined;
    for (const name of splitPath) {
      [dir] = await db
        .select()
        .from(directories)
        .where(
          and(
            eq(directories.name, name),
            eq(directories.ownerId, this.userId),
            dir
              ? eq(directories.parentId, dir.id)
              : isNull(directories.parentId)
          )
        );
      if (!dir) break;
    }
    if (!dir) throw new Error();
    return dir;
  }

  private async getFile(relativePath: string): Promise<File | null> {
    const [dirPath, name] = this.splitPath(relativePath);
    const dir = await this.getDirectory(dirPath);
    if (!name) throw new Error();
    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.name, name),
          eq(files.ownerId, this.userId),
          dir ? eq(files.directoryId, dir.id) : isNull(files.directoryId)
        )
      );
    return file || null;
  }

  private splitPath(path: string): [dirPath: string, name?: string] {
    if (path === "/") return ["/", undefined];
    if (!path.includes("/")) throw new Error();
    const splitPath = path.split("/");
    return [splitPath.slice(0, -1)?.join("/") || "/", splitPath.slice(-1)[0]];
  }

  private transformFile(file: File, relativePath: string): FSNode {
    return {
      id: file.id,
      type: "file",
      name: file.name,
      path: this.getAbsolutePath(relativePath),
      size: file.size ?? undefined,
      mimeType: file.mimeType || undefined,
      createDate: file.createdAt,
      updateDate: file.updatedAt,
      ownerId: file.ownerId,
    };
  }

  private transformDirectory(dir: Directory, relativePath: string): FSNode {
    return {
      id: dir.id,
      type: "directory",
      name: dir.name,
      path: this.getAbsolutePath(relativePath),
      size: undefined,
      mimeType: undefined,
      createDate: dir.createdAt,
      updateDate: dir.updatedAt,
      ownerId: dir.ownerId,
    };
  }

  public getWorkingDirectory() {
    return this.workingDirectory;
  }

  public setWorkingDirectory(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  public async createDirectory(path: string): Promise<void> {
    const splitPath = this.getAbsolutePath(path).split("/").filter(Boolean);
    if (!splitPath.length) throw new Error();
    const remainingPath = [...splitPath];
    let dir;
    for (const name of splitPath) {
      const [exists] = await db
        .select()
        .from(directories)
        .where(
          and(
            eq(directories.name, name),
            eq(directories.ownerId, this.userId),
            dir
              ? eq(directories.parentId, dir.id)
              : isNull(directories.parentId)
          )
        );
      if (exists) {
        dir = exists;
        remainingPath.shift();
      } else break;
    }
    if (!remainingPath.length) throw new Error();
    for (const path of remainingPath) {
      [dir] = await db
        .insert(directories)
        .values({ name: path, parentId: dir?.id, ownerId: this.userId })
        .returning();
    }
  }

  public async deleteDirectory(path: string): Promise<void> {
    const dir = await this.getDirectory(path);
    if (!dir) throw new Error();
    const list = await this.listDirectory(path);
    await Promise.all(
      list.map((node) => {
        if (node.type === "file")
          return this.deleteFile(`${path}/${node.name}`);
        if (node.type === "directory")
          return this.deleteDirectory(`${path}/${node.name}`);
      })
    );
    await db.delete(directories).where(eq(directories.id, dir.id));
  }

  public async copyDirectory(path: string, newPath: string): Promise<void> {
    const dir = await this.getDirectory(path);
    if (!dir) throw new Error();
    const list = await this.listDirectory(path);

    const [newParentPath, newName] = this.splitPath(newPath);
    const parent = await this.getDirectory(newParentPath);
    await db.insert(directories).values({
      name: newName || dir.name,
      parentId: parent?.id,
      ownerId: this.userId,
    });
    await Promise.all(
      list.map((node) => {
        return this[node.type === "directory" ? "copyDirectory" : "copyFile"](
          `${path}/${node.name}`,
          `${newPath}/${node.name}`
        );
      })
    );
  }

  public async moveDirectory(path: string, newPath: string): Promise<void> {
    const dir = await this.getDirectory(path);
    if (!dir) throw new Error();
    const [newParentPath, newName] = this.splitPath(newPath);
    const parent = await this.getDirectory(newParentPath);
    await db
      .update(directories)
      .set({
        name: newName || dir.name,
        parentId: parent?.id,
        updatedAt: new Date(),
      })
      .where(eq(directories.id, dir.id));
  }

  public async listDirectory(path: string = "/"): Promise<FSNode[]> {
    const dir = await this.getDirectory(path);
    const nodes: FSNode[] = (
      await db
        .select()
        .from(directories)
        .where(
          dir
            ? eq(directories.parentId, dir.id)
            : and(
                eq(directories.ownerId, this.userId),
                isNull(directories.parentId)
              )
        )
        .orderBy(directories.name)
    ).map((dir) => this.transformDirectory(dir, path));
    nodes.push(
      ...(
        await db
          .select()
          .from(files)
          .where(
            dir
              ? eq(files.directoryId, dir.id)
              : and(eq(files.ownerId, this.userId), isNull(files.directoryId))
          )
          .orderBy(files.name)
      ).map((file) => this.transformFile(file, path))
    );
    return nodes;
  }

  public async getFileById(id: number): Promise<File | null> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.ownerId, this.userId)));
    return file || null;
  }

  public async writeFile(
    path: string,
    content: string | Blob,
    size?: number,
    mimeType?: string
  ): Promise<void> {
    const [dirPath, name] = this.splitPath(path);
    if (!name || content === "undefined") throw new Error();
    const dir = await this.getDirectory(dirPath);
    const uri = new Bun.CryptoHasher("blake2b256")
      .update(content)
      .digest("hex");
    const duplicateFiles = await db
      .select()
      .from(files)
      .where(eq(files.uri, uri));
    if (!duplicateFiles.length) await FSService.write(uri, content);
    await db.insert(files).values({
      name: name || uri,
      ownerId: this.userId,
      directoryId: dir?.id,
      uri,
      size: size || (content instanceof Blob ? content.size : undefined),
      mimeType,
    });
  }

  public async readFile(path: string): Promise<Blob> {
    const file = await this.getFile(path);
    if (!file) throw new Error();
    const content = await FSService.file(file.uri);
    return new Blob([content]);
  }

  public async deleteFile(path: string): Promise<void> {
    const file = await this.getFile(path);
    if (!file) throw new Error();

    const identicalFiles = await db
      .select()
      .from(files)
      .where(eq(files.uri, file.uri));
    if (identicalFiles.length === 1) await FSService.delete(file.uri);
    await db.delete(files).where(eq(files.id, file.id));
  }

  public async copyFile(path: string, newPath: string): Promise<void> {
    if (path === newPath) throw new Error();
    const file = await this.getFile(path);
    if (!file) throw new Error();
    const [dirPath, name] = this.splitPath(newPath);
    const dir = await this.getDirectory(dirPath);
    await db.insert(files).values({
      name: name || file.name,
      ownerId: this.userId,
      directoryId: dir?.id,
      uri: file.uri,
      size: file.size,
      mimeType: file.mimeType,
    });
  }

  public async moveFile(path: string, newPath: string): Promise<void> {
    if (path === newPath) throw new Error();
    const file = await this.getFile(path);
    if (!file) throw new Error();
    const [dirPath, name] = this.splitPath(newPath);
    const dir = await this.getDirectory(dirPath);
    await db
      .update(files)
      .set({
        directoryId: dir?.id,
        name: name || file.name,
        updatedAt: new Date(),
      })
      .where(eq(files.id, file.id));
  }

  public async getInfo(path: string): Promise<FSNode> {
    const file = await this.getFile(path);
    if (!file) throw new Error();
    return this.transformFile(file, this.splitPath(path)[0]);
  }
}
