import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function ClientLayout() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    // Wait until AuthContext finishes loading the session
    if (loading) {
      return;
    }

    // No session -> login
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Admins should not access client routes
    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  // AuthContext is still checking the stored session
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />

        <Text style={styles.text}>
          Cargando sesión...
        </Text>
      </View>
    );
  }

  // Don't render client content while redirecting
  if (!user || user.role !== "CLIENT") {
    return null;
  }

  // User is authenticated and is a CLIENT
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});