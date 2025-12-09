import { useFS } from "../../../context/FSContext";
import { FSListItem } from "./ListItem";
import styles from "./styles.module.css";

export function FSList() {
  const { nodes, path } = useFS();
  return (
    <div className={styles.list}>
      {path !== "/" && <FSListItem />}
      {nodes.map((node) => (
        <FSListItem key={node.name} node={node} />
      ))}
    </div>
  );
}
