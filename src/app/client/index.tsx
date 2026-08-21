import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function ClientHomeScreen() {
  const router = useRouter();

  const {
    user,
    loading,
    signOut,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [
    loading,
    user,
    router,
  ]);

  async function handleLogout() {
    try {
      await signOut();

      router.replace(
        "/auth/login"
      );
    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
    }
  }

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.statusText
          }
        >
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (
    !user ||
    user.role !== "CLIENT"
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Barbería Cale
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Hola, {user.firstName}.
        ¿Qué deseas hacer?
      </Text>

      <Pressable
        style={
          styles.primaryButton
        }
        onPress={() =>
          router.push(
            "/client/appointment"
          )
        }
      >
        <Text
          style={
            styles.primaryButtonText
          }
        >
          Agendar cita
        </Text>
      </Pressable>

      <Pressable
        style={
          styles.secondaryButton
        }
        onPress={() =>
          router.push(
            "/client/my-appointments"
          )
        }
      >
        <Text
          style={
            styles.secondaryButtonText
          }
        >
          Mis citas
        </Text>
      </Pressable>

      <Pressable
        style={
          styles.logoutButton
        }
        onPress={
          handleLogout
        }
      >
        <Text
          style={
            styles.logoutText
          }
        >
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    color: "#555",
    marginBottom: 32,
    textAlign: "center",
  },

  statusText: {
    fontSize: 16,
    color: "#555",
    marginTop: 12,
  },

  primaryButton: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryButton: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
  },

  logoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  logoutText: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
});