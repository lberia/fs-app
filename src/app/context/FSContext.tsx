import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FSContext, FSNode, NodeAction } from "../types/FS";
import { formatPath } from "../utils";

const FSContext = createContext<FSContext | undefined>(undefined);

export function FSProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<FSNode[]>([]);
  const [path, setPath] = useState<string>(window.location.pathname || "/");
  const [nodeAction, setNodeAction] = useState<NodeAction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const modalRoot = useRef<HTMLDivElement>(null);

  const deleteNode: FSContext["deleteNode"] = async (node: FSNode) => {
    if (isLoading) return false;
    setIsLoading(true);
    const res = await fetch(
      node.type === "file" ? "/api/file" : "/api/directory",
      {
        method: "DELETE",
        body: JSON.stringify({ path: formatPath(`${node.path}/${node.name}`) }),
      }
    );
    if (res.ok) list();
    setIsLoading(false);
    return res.ok;
  };

  const list: FSContext["list"] = async (newPath?: string) => {
    if (isLoading) return false;
    setIsLoading(true);
    newPath = formatPath(newPath || path);
    window.history.pushState({}, "", newPath);
    const res = await fetch("/api/directory/list", {
      method: "POST",
      body: JSON.stringify({ path: newPath }),
    });
    if (res.ok) {
      const nodes = await res.json();
      setNodes(nodes);
      setPath(newPath);
    } else if (newPath !== "/")
      list(newPath.split("/").slice(0, -1).join("/") || "/");
    setIsLoading(false);
    return res.ok;
  };

  const createDirectory: FSContext["createDirectory"] = async (
    name: string
  ) => {
    if (isLoading || !name) return false;
    setIsLoading(true);
    const res = await fetch("/api/directory", {
      method: "POST",
      body: JSON.stringify({ path: `${path}/${name}` }),
    });
    if (res.ok) list();
    else setIsLoading(false);
    return res.ok;
  };

  const upload: FSContext["upload"] = async (
    file: File,
    name?: string,
    mimeType?: string,
    size?: number
  ) => {
    if (isLoading) return false;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("path", formatPath(`${path}/${name}`));
    if (mimeType) formData.append("mimeType", mimeType);
    if (size) formData.append("size", size.toString());

    try {
      const res = await fetch("/api/file", { method: "POST", body: formData });

      if (res.ok) list();
      else setIsLoading(false);

      return res.ok;
    } catch (error) {
      return false;
    }
  };

  const viewFile: FSContext["viewFile"] = async (node: FSNode) => {
    const newWindow = window.open(`/api/file/${node.id}`, "_blank");
    if (newWindow)
      newWindow.onload = () => (newWindow.document.title = node.name);
  };

  useEffect(() => {
    list();
    function listener() {
      list(window.location.pathname);
    }
    window.addEventListener("popstate", listener);
    return function () {
      window.removeEventListener("popstate", listener);
    };
  }, []);

  const confirmAction: FSContext["confirmAction"] = async (
    newName?: string
  ) => {
    if (!nodeAction || isLoading) return false;
    const { node, action } = nodeAction;
    setIsLoading(true);
    const res = await fetch(`/api/${node.type}/${action}`, {
      method: "POST",
      body: JSON.stringify({
        path: formatPath(`${node.path}/${node.name}`),
        newPath: formatPath(`${path}/${newName || node.name}`),
      }),
    });
    if (res.ok) list();
    else list(node.path);
    setNodeAction(null);
    return res.ok;
  };

  const value = {
    path,
    nodes,
    isLoading,
    list,
    createDirectory,
    upload,
    deleteNode,
    modalRoot,
    viewFile,
    nodeAction,
    setNodeAction,
    confirmAction,
  };

  return <FSContext.Provider value={value}>{children}</FSContext.Provider>;
}

export function useFS() {
  const context = useContext(FSContext);
  if (context === undefined)
    throw new Error("useFS must be used within an FSProvider");

  return context;
}
