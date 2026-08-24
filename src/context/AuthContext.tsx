import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import {
  type AuthUser,
  type LoginData,
  type RegisterData,
  loginUser,
  registerUser,
  validateSession,
} from "../api/auth.api";
import {
  ApiError,
  setUnauthorizedHandler,
} from "../api/api-client";
import { showMessage } from "../utils/show-message";

type StoredSession = {
  token: string;
  user: AuthUser;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (data: LoginData) => Promise<AuthUser>;
  signUp: (data: RegisterData) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = "barberia_cale_session";
const LEGACY_SESSION_KEY = "@barberia_cale_session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as Partial<AuthUser>;
  const id = Number(user.id);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  if (
    typeof user.firstName !== "string" ||
    typeof user.lastName !== "string" ||
    typeof user.phone !== "string" ||
    (user.role !== "CLIENT" && user.role !== "ADMIN")
  ) {
    return null;
  }

  return {
    id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

function parseStoredSession(value: string): StoredSession | null {
  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>;

    const user = parseAuthUser(parsed.user);

    if (typeof parsed.token !== "string" || !user) {
      return null;
    }

    return {
      token: parsed.token,
      user,
    };
  } catch {
    return null;
  }
}

function authUsersMatch(first: AuthUser, second: AuthUser) {
  return (
    first.id === second.id &&
    first.firstName === second.firstName &&
    first.lastName === second.lastName &&
    first.phone === second.phone &&
    first.role === second.role
  );
}

async function removeLegacySessionBestEffort() {
  try {
    await AsyncStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // La clave principal ya determina la sesión. Una limpieza heredada no
    // debe convertir un inicio de sesión exitoso en un falso error.
  }
}

async function removePersistedSession() {
  if (Platform.OS === "web") {
    await Promise.all([
      AsyncStorage.removeItem(SESSION_KEY),
      AsyncStorage.removeItem(LEGACY_SESSION_KEY),
    ]);
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY),
    AsyncStorage.removeItem(LEGACY_SESSION_KEY),
  ]);
}

async function persistSession(session: StoredSession) {
  const serialized = JSON.stringify(session);

  if (Platform.OS === "web") {
    await AsyncStorage.setItem(SESSION_KEY, serialized);
    await removeLegacySessionBestEffort();
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, serialized);
  await removeLegacySessionBestEffort();
}

async function readPersistedSession() {
  if (Platform.OS === "web") {
    const current = await AsyncStorage.getItem(SESSION_KEY);

    if (current) {
      return current;
    }

    const legacy = await AsyncStorage.getItem(LEGACY_SESSION_KEY);

    if (legacy) {
      await AsyncStorage.setItem(SESSION_KEY, legacy);
      await removeLegacySessionBestEffort();
    }

    return legacy;
  }

  const current = await SecureStore.getItemAsync(SESSION_KEY);

  if (current) {
    return current;
  }

  // Migra una sesión creada por versiones anteriores sin dejar el token en
  // AsyncStorage una vez que SecureStore confirma la escritura.
  const legacy = await AsyncStorage.getItem(LEGACY_SESSION_KEY);

  if (legacy) {
    await SecureStore.setItemAsync(SESSION_KEY, legacy);
    await removeLegacySessionBestEffort();
  }

  return legacy;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const setSessionState = useCallback((session: StoredSession | null) => {
    tokenRef.current = session?.token ?? null;
    setToken(session?.token ?? null);
    setUser(session?.user ?? null);
  }, []);

  const expireSession = useCallback(
    async (rejectedToken?: string) => {
      if (rejectedToken && tokenRef.current !== rejectedToken) {
        return;
      }

      setSessionState(null);

      if (rejectedToken) {
        showMessage(
          "Sesión expirada",
          "Tu sesión terminó por seguridad. Inicia sesión nuevamente.",
          { kind: "error" }
        );
      }

      try {
        await removePersistedSession();
      } catch {
        // La sesión queda cerrada en memoria aunque el dispositivo rechace la
        // limpieza. El próximo arranque volverá a validarla con el servidor.
      }
    },
    [setSessionState]
  );

  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const serialized = await readPersistedSession();

        if (!serialized) {
          return;
        }

        const storedSession = parseStoredSession(serialized);

        if (!storedSession) {
          await removePersistedSession();
          return;
        }

        try {
          const result = await validateSession(storedSession.token);

          if (active) {
            setSessionState({
              token: storedSession.token,
              user: result.user,
            });
          }

          if (!authUsersMatch(result.user, storedSession.user)) {
            try {
              await persistSession({
                token: storedSession.token,
                user: result.user,
              });
            } catch {
              // El token persistido sigue siendo válido. La identidad pública
              // volverá a sincronizarse en el próximo arranque.
            }
          }
        } catch (error) {
          const sessionIsDefinitelyInvalid =
            error instanceof ApiError &&
            (error.status === 401 || error.status === 404);

          if (sessionIsDefinitelyInvalid) {
            await removePersistedSession();

            if (active) {
              showMessage(
                "Sesión no disponible",
                "Tu sesión anterior ya no es válida. Inicia sesión nuevamente.",
                { kind: "error" }
              );
            }

            return;
          }

          if (!active) {
            return;
          }

          if (storedSession.user.role === "CLIENT") {
            // La identidad CLIENT permite conservar continuidad sin exponer
            // herramientas administrativas. Cada endpoint vuelve a comprobar
            // el rol vigente en el servidor.
            setSessionState(storedSession);
            showMessage(
              "Sesión sin verificar",
              "No pudimos confirmar tu sesión con el servidor. Puedes revisar la aplicación y volver a intentar cuando tengas conexión."
            );
          } else {
            // Nunca autorizamos el área ADMIN únicamente con datos locales:
            // el rol pudo cambiar o el almacenamiento web pudo ser alterado.
            showMessage(
              "Verificación administrativa pendiente",
              "Conéctate a internet e inicia sesión nuevamente para acceder al panel administrativo.",
              { kind: "error" }
            );
          }
        }
      } catch {
        // Un almacenamiento inaccesible no debe bloquear el acceso público.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [setSessionState]);

  async function saveSession(
    session: StoredSession,
    rememberMe: boolean
  ) {
    // La autenticación del servidor ya terminó correctamente. Un fallo del
    // almacenamiento no debe convertir el login o registro en un falso fallo.
    setSessionState(session);

    try {
      if (rememberMe) {
        await persistSession(session);
      } else {
        await removePersistedSession();
      }
    } catch {
      showMessage(
        "Sesión iniciada sin guardar",
        rememberMe
          ? "La sesión funciona ahora, pero el dispositivo no pudo recordarla. Tendrás que iniciar sesión al volver a abrir la aplicación."
          : "La sesión funciona ahora, pero el dispositivo no confirmó la limpieza de una sesión anterior.",
        { kind: "error", durationMs: 8_000 }
      );
    }
  }

  async function signIn(data: LoginData) {
    const result = await loginUser(data);

    await saveSession(
      {
        token: result.token,
        user: result.user,
      },
      data.rememberMe
    );

    return result.user;
  }

  async function signUp(data: RegisterData) {
    const result = await registerUser(data);

    await saveSession(
      {
        token: result.token,
        user: result.user,
      },
      data.rememberMe
    );

    return result.user;
  }

  async function signOut() {
    let storageError: unknown;

    try {
      await removePersistedSession();
    } catch (error) {
      storageError = error;
    } finally {
      setSessionState(null);
    }

    if (storageError) {
      throw new Error(
        "La sesión se cerró, pero el dispositivo no confirmó la limpieza local. Cierra la aplicación antes de volver a usarla."
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
