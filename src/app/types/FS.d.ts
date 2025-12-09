import type { RefObject } from "react";

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

export interface FSContext {
  path: string;
  nodes: FSNode[];
  upload: (
    file: File,
    name?: string,
    mimeType?: string,
    size?: number
  ) => Promise<boolean>;
  list: (newPath?: string) => Promise<boolean>;
  createDirectory: (name: string) => Promise<boolean>;
  deleteNode: (node: FSNode) => Promise<boolean>;
  viewFile: (node: FSNode) => void;
  isLoading: boolean;
  modalRoot: RefObject<HTMLDivElement | null>;
  nodeAction: NodeAction | null;
  setNodeAction: (node: NodeAction | null) => void;
  confirmAction: (newName?: string) => Promise<boolean>;
}

export type NodeAction = { node: FSNode; action: "move" | "copy" };
