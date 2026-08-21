import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    AuthUser,
    loginUser,
    registerUser,
} from "../api/auth.api";

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

type StoredSession = {
  token: string;

  user: AuthUser;
};

type AuthContextType = {
  user:
    | AuthUser
    | null;

  token:
    | string
    | null;

  loading: boolean;

  signIn:
    (
      data: LoginData
    ) => Promise<AuthUser>;

  signUp:
    (
      data: RegisterData
    ) => Promise<AuthUser>;

  signOut:
    () => Promise<void>;
};

const SESSION_KEY =
  "@barberia_cale_session";

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

type AuthProviderProps = {
  children:
    ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null
    );

  const [
    token,
    setToken,
  ] =
    useState<string | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedSession =
        await AsyncStorage
          .getItem(
            SESSION_KEY
          );

      if (!storedSession) {
        return;
      }

      const parsedSession:
        StoredSession =
          JSON.parse(
            storedSession
          );

      if (
        !parsedSession.token ||
        !parsedSession.user
      ) {
        await AsyncStorage
          .removeItem(
            SESSION_KEY
          );

        return;
      }

      setToken(
        parsedSession.token
      );

      setUser(
        parsedSession.user
      );
    } catch (error) {
      console.error(
        "Error restaurando sesión:",
        error
      );

      await AsyncStorage
        .removeItem(
          SESSION_KEY
        );
    } finally {
      setLoading(false);
    }
  }

  async function saveSession(
    session:
      StoredSession,
    rememberMe:
      boolean
  ) {
    /*
     * Siempre actualizamos
     * la sesión en memoria.
     */
    setToken(
      session.token
    );

    setUser(
      session.user
    );

    /*
     * Si el usuario quiere
     * mantener sesión:
     * guardamos el token.
     */
    if (rememberMe) {
      await AsyncStorage
        .setItem(
          SESSION_KEY,
          JSON.stringify(
            session
          )
        );

      return;
    }

    /*
     * Si no quiere persistencia,
     * eliminamos cualquier sesión
     * guardada anteriormente.
     */
    await AsyncStorage
      .removeItem(
        SESSION_KEY
      );
  }

  async function signIn(
    data: LoginData
  ) {
    const result =
      await loginUser(
        data
      );

    await saveSession(
      {
        token:
          result.token,

        user:
          result.user,
      },
      data.rememberMe
    );

    return result.user;
  }

  async function signUp(
    data: RegisterData
  ) {
    const result =
      await registerUser(
        data
      );

    await saveSession(
      {
        token:
          result.token,

        user:
          result.user,
      },
      data.rememberMe
    );

    return result.user;
  }

  async function signOut() {
    setUser(null);

    setToken(null);

    await AsyncStorage
      .removeItem(
        SESSION_KEY
      );
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
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}