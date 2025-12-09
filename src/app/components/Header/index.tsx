import { useAuth } from "../../context/AuthContext";
import styles from "./styles.module.css";

export function Header() {
  const { user, logout } = useAuth();
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h2>FILE SYSTEM</h2>
        {user && (
          <div className={styles.auth}>
            {user.email}
            <input type="button" value="logout" onClick={logout} />
          </div>
        )}
      </div>
    </div>
  );
}
