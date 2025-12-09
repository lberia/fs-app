import { useEffect, useState } from "react";
import { useFS } from "../../context/FSContext";

import styles from "./styles.module.css";

export function FSPath() {
  const { path, nodeAction, list } = useFS();
  const [value, setValue] = useState(path);

  useEffect(() => {
    setValue(path);
  }, [path]);
  return (
    <div className={styles.path}>
      {nodeAction && nodeAction.node.path !== path ? (
        <div className={styles.actionPathStatus}>
          {nodeAction.action} from{" "}
          <span className={styles.pathFrom}>{nodeAction.node.path}</span> to{" "}
          <span className={styles.pathTo}>{path}</span>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            list(value);
          }}
        >
          <input value={value} onChange={(e) => setValue(e.target.value)} />
        </form>
      )}
    </div>
  );
}
