import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthContext, User } from "../types/auth";

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/auth/identify", { method: "POST" }).then(async (res) => {
      if (res.ok) {
        const user = await res.json();
        setUser(user);
      }
      setIsLoading(false);
    });
  }, []);

  const login: AuthContext["login"] = async (credentials) => {
    if (isLoading) return;
    setIsLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    const user: User = await res.json();
    if (user.id) setUser(user);
    setIsLoading(false);
  };

  const logout: AuthContext["logout"] = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const res = await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsLoading(false);
  };

  const register: AuthContext["register"] = async (body) => {
    if (isLoading) return;
    setIsLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const user: User = await res.json();
    if (user.id) setUser(user);
    setIsLoading(false);
  };

  const value = { user, login, logout, register, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
}
