const API_URL = "http://192.168.0.13:4000/api";

export type RegisterData = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

export async function registerUser(data: RegisterData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo crear la cuenta."
    );
  }

  return result;
}

export type LoginData = {
  phone: string;
  password: string;
};

export async function loginUser(data: LoginData) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo iniciar sesión."
    );
  }

  return result;
}