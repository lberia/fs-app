import {
  useState,
  type ChangeEventHandler,
  type InputEventHandler,
} from "react";
import { Auth } from "./components/Auth";
import { useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";

import styles from "./styles.module.css";
import { FileSystem } from "./components/FileSystem";

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <div className={styles.container}>
        {!user ? <Auth /> : <FileSystem />}
      </div>
    </>
  );
}
