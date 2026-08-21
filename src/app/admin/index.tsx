import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function AdminHomeScreen() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/client");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Barbería Cale
      </Text>

      <Text style={styles.adminLabel}>
        Panel administrativo
      </Text>

      <Text style={styles.welcome}>
        Hola, {user.firstName}
      </Text>

      <Text style={styles.subtitle}>
        Administra las citas y la agenda de la barbería.
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.push("/admin/appointments")
        }
      >
        <Text style={styles.primaryButtonText}>
          Gestionar citas
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push("/admin/schedule")
        }
      >
        <Text style={styles.secondaryButtonText}>
          Ver agenda
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

  loadingText: {
    fontSize: 16,
    color: "#666",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 6,
  },

  adminLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 16,
  },

  welcome: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: "#555",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 380,
  },

  primaryButton: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryButton: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
});