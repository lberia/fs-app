import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { useFS } from "../../../context/FSContext";
import { Modal } from "../Modal";
import Loader from "../../Loader";

import styles from "./styles.module.css";
import { formatBytes } from "../../../utils";

export function UploadFIle() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const { upload, isLoading } = useFS();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedFile(null);
      setMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    }
  }, [isOpen]);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    setSelectedFile(file);
    setMessage("");
    if (!name) setName(file.name);
    setTimeout(() => fileNameRef.current?.focus(), 50);
  };

  const handleUpload = async () => {
    if (!selectedFile) return fileInputRef.current?.click();

    try {
      const result = await upload(
        selectedFile,
        name,
        selectedFile.type,
        selectedFile.size
      );

      if (result) {
        setMessage("Upload successful!");
        setIsOpen(false);
      } else setMessage("Upload failed");
    } catch (error) {
      setMessage(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error("error -> ", error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Upload</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            className={styles.hidden}
            ref={fileInputRef}
          />
          {selectedFile && (
            <div className={styles.selectedFileInfo}>
              <span className={styles.selectedFileName}>
                {selectedFile.name.split(".").slice(0, -1).join(".")}
              </span>
              .{selectedFile.name.split(".").slice(-1)[0]} | {selectedFile.type}{" "}
              | {formatBytes(selectedFile.size)}
            </div>
          )}
          <input
            placeholder="File Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            ref={fileNameRef}
          />
          {message && <div className={styles.message}>{message}</div>}
          <button type="submit" disabled={!!selectedFile && !name}>
            File Upload
          </button>
        </form>
      </Modal>
    </>
  );
}
