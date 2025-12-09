import { useEffect, useRef, useState } from "react";
import { useFS } from "../../../context/FSContext";
import { Modal } from "../Modal";

import styles from "./styles.module.css";

export function AddDir() {
  const [isOpen, setIsOpen] = useState(false);
  const [dirName, setDirName] = useState("");
  const dirNameRef = useRef<HTMLInputElement>(null);
  const { createDirectory } = useFS();
  useEffect(() => {
    if (isOpen) {
      setDirName("");
      setTimeout(() => dirNameRef.current?.focus(), 50);
    }
  }, [isOpen]);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Directory</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            createDirectory(dirName).then(() => setIsOpen(false));
          }}
        >
          <input
            type="text"
            placeholder="Directory Name"
            value={dirName}
            ref={dirNameRef}
            onChange={(e) => setDirName(e.target.value)}
          />
          <button type="submit" disabled={!dirName}>
            Add
          </button>
        </form>
      </Modal>
    </>
  );
}
