import type { File } from "../models/file.model";

export interface FSNode {
  id: number;
  type: "file" | "directory";
  name: string;
  path: string;
  size?: number;
  mimeType?: string;
  createDate?: Date;
  updateDate: Date;
  ownerId: number;
}

export interface FSProvider {
  getWorkingDirectory(): string;
  setWorkingDirectory(workingDirectory: string): void;
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  copyDirectory(path: string, newPath: string): Promise<void>;
  moveDirectory(path: string, newPath: string): Promise<void>;
  listDirectory(path?: string): Promise<FSNode[]>;

  getFileById(id: number): Promise<File | null>;
  writeFile: (
    path: string,
    content: string | Blob,
    size?: number,
    mimeType?: string
  ) => Promise<void>;
  readFile(path: string): Promise<Blob>;
  deleteFile(path: string): Promise<void>;
  copyFile(path: string, newPath: string): Promise<void>;
  moveFile(path: string, newPath: string): Promise<void>;

  getInfo(path: string): Promise<FSNode>;
}
