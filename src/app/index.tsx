import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./app";
import React from "react";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
