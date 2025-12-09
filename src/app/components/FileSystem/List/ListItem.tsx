import { useState } from "react";
import { useFS } from "../../../context/FSContext";
import type { FSNode } from "../../../types/FS";
import { Modal } from "../Modal";
import styles from "./styles.module.css";
import { formatBytes } from "../../../utils";

export function FSListItem({ node }: { node?: FSNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { list, path, deleteNode, viewFile, nodeAction, setNodeAction } =
    useFS();

  return (
    <>
      {node?.type === "file" && (
        <Modal
          title="FILE DETAILS"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        >
          <div className={styles.fileDetails}>
            <p>filename: {node.name}</p>
            <p>path: {node.path}</p>
            {node.mimeType && <p>MIME type: {node.mimeType}</p>}
            {node.size && <p>size: {formatBytes(node.size)}</p>}
            {node.createDate && (
              <p>Created at: {new Date(node.createDate).toLocaleString()}</p>
            )}
            {node.updateDate && (
              <p>Updated at: {new Date(node.updateDate).toLocaleString()}</p>
            )}
          </div>
        </Modal>
      )}
      <div
        onClick={() => {
          if (!node) list(path.split("/").slice(0, -1).join("/") || "/");
          else if (node.type === "directory") list(`${path}/${node.name}`);
          else setIsOpen(true);
        }}
        className={
          nodeAction && node?.type === "file"
            ? styles.itemDisabled
            : styles.item
        }
      >
        <div className={styles.itemName}>{node?.name || ".."}</div>
        {node && !nodeAction && (
          <div className={styles.actions}>
            {node.type === "file" && (
              <button
                className={styles.viewButton}
                onClick={(e) => {
                  e.stopPropagation();
                  viewFile(node);
                }}
              >
                view
              </button>
            )}
            <button
              className={styles.copyButton}
              onClick={(e) => {
                e.stopPropagation();
                setNodeAction({ node, action: "copy" });
              }}
            >
              copy
            </button>
            <button
              className={styles.moveButton}
              onClick={(e) => {
                e.stopPropagation();
                setNodeAction({ node, action: "move" });
              }}
            >
              move
            </button>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node);
              }}
            >
              delete
            </button>
          </div>
        )}
      </div>
    </>
  );
}
