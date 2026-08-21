import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
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
        <ActivityIndicator size="large" />

        <Text style={styles.text}>
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

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