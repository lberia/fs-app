import styles from "./styles.module.css";

export default function Loader({
  value = true,
  opaque = false,
  children,
}: {
  value?: boolean;
  opaque?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={
        !value
          ? styles.hiddenContainer
          : opaque
          ? styles.opaqueContainer
          : styles.container
      }
    >
      <div className={styles.spinner}></div>
      <div className={styles.smallerSpinner}></div>
      {children}
    </div>
  );
}
