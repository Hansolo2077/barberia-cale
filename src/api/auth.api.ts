import { apiRequest } from "./api-client";

export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: "CLIENT" | "ADMIN";
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};

export type SessionValidationResponse = {
  success: boolean;
  user: AuthUser;
};

export type LoginData = {
  phone: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterData = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  rememberMe: boolean;
};

export function loginUser(data: LoginData) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    json: data,
  });
}

export function registerUser(data: RegisterData) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    json: data,
  });
}

export function validateSession(token: string) {
  return apiRequest<SessionValidationResponse>("/auth/me", {
    method: "GET",
    token,
    // La restauración decide si la sesión es inválida. Evita dos cierres
    // simultáneos provocados por la misma respuesta.
    notifyOnUnauthorized: false,
  });
}
