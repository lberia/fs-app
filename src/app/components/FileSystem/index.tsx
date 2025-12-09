import { FSProvider, useFS } from "../../context/FSContext";
import Loader from "../Loader";
import { FSActions } from "./Actions";
import { FSList } from "./List";
import { FSPath } from "./Path";
import styles from "./styles.module.css";

function FileSystem() {
  const { isLoading, modalRoot } = useFS();

  return (
    <div className={styles.container}>
      <div ref={modalRoot}></div>
      <FSActions />
      <FSPath />
      <FSList />
      <Loader value={isLoading} />
    </div>
  );
}

function FileSystemWrapper() {
  return (
    <FSProvider>
      <FileSystem />
    </FSProvider>
  );
}

export { FileSystemWrapper as FileSystem };
