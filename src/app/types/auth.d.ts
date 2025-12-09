export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterBody extends LoginCredentials {
  name?: string;
}

export interface AuthContext {
  user: User | null;
  login: (credentials: LoginCredentials) => void;
  logout: () => void;
  register: (credentials: RegisterBody) => void;
  isLoading: boolean;
}
