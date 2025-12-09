import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import styles from "./styles.module.css";
import Loader from "../Loader";

export function Auth() {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className={styles.container}>
      <h3>LOGIN OR SIGNUP</h3>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;"
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className={styles.buttons}>
        <input
          type="button"
          value="login"
          onClick={() => login({ email, password })}
        />
        <input
          type="button"
          value="register"
          onClick={() => register({ email, password })}
        />
      </div>
      <Loader value={isLoading} />
    </div>
  );
}
