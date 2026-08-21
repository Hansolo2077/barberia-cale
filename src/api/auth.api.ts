const API_URL =
  "http://localhost:4000/api";

export type AuthUser = {
  id: number;

  firstName: string;

  lastName: string;

  phone: string;

  role:
    | "CLIENT"
    | "ADMIN";
};

export type AuthResponse = {
  success: boolean;

  message: string;

  token: string;

  user: AuthUser;
};

type LoginData = {
  phone: string;

  password: string;

  rememberMe: boolean;
};

type RegisterData = {
  firstName: string;

  lastName: string;

  phone: string;

  password: string;

  rememberMe: boolean;
};

export async function loginUser(
  data: LoginData
): Promise<AuthResponse> {
  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo iniciar sesión."
    );
  }

  return result;
}

export async function registerUser(
  data: RegisterData
): Promise<AuthResponse> {
  const response =
    await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo crear la cuenta."
    );
  }

  return result;
}