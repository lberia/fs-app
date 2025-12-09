import styles from "./styles.module.css";
import { UploadFIle } from "./Upload";
import { AddDir } from "./AddDir";
import { useFS } from "../../../context/FSContext";
import { useEffect, useRef, useState } from "react";

export function FSActions() {
  const { path, nodeAction, setNodeAction, confirmAction, list } = useFS();
  const [newName, setNewName] = useState("");
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const cancel = () => {
    if (!nodeAction) return;
    list(nodeAction.node.path);
    setNodeAction(null);
  };

  useEffect(() => {
    if (nodeAction) {
      setNewName(nodeAction.node.name);
      newNameInputRef.current?.focus();
      const cancelListener = (event: KeyboardEvent) =>
        event.key === "Escape" && cancel();
      document.addEventListener("keydown", cancelListener);
      return () => {
        document.removeEventListener("keydown", cancelListener);
        setNewName("");
      };
    }
  }, [nodeAction]);

  useEffect(() => {
    if (nodeAction && newNameInputRef.current) newNameInputRef.current.focus();
  }, [path]);
  return (
    <div className={styles.container}>
      {nodeAction && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmAction(newName);
          }}
        >
          <input
            ref={newNameInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={
              path === nodeAction.node.path && newName === nodeAction.node.name
            }
            className={styles.confirm}
          >
            Confirm
          </button>
          <button className={styles.cancel} onClick={cancel}>
            Cancel
          </button>
        </form>
      )}
      <AddDir />
      {!nodeAction && <UploadFIle />}
      {nodeAction && (
        <div className={styles.actionName}>
          {nodeAction.action.toUpperCase()}
        </div>
      )}
    </div>
  );
}
