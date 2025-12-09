import { useEffect, type MouseEvent } from "react";
import styles from "./styles.module.css";
import { createPortal } from "react-dom";
import { useFS } from "../../context/FSContext";

export function Modal({
  children,
  isOpen,
  onClose,
  title,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: (e?: MouseEvent<HTMLDivElement>) => void;
  title?: string;
}) {
  const { modalRoot } = useFS();

  useEffect(() => {
    if (isOpen) {
      const listener = (event: KeyboardEvent) =>
        event.key === "Escape" && isOpen && onClose();
      document.addEventListener("keydown", listener);
      return () => document.removeEventListener("keydown", listener);
    }
  }, [isOpen]);

  if (!modalRoot.current) return <></>;

  return createPortal(
    <div className={isOpen ? styles.modalOpen : styles.modal}>
      <div className={styles.modalBackground} onClick={() => onClose()}></div>
      <div className={styles.modalContent}>
        {title && <div className={styles.modalTitle}>{title}</div>}
        {children}
      </div>
    </div>,
    modalRoot.current
  );
}
