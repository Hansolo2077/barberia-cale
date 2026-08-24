import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../constants/app-theme";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          accessibilityLabel="Cargando sesión"
        />
        <Text style={styles.loadingText}>Cargando sesión…</Text>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <Redirect href={user.role === "ADMIN" ? "/admin" : "/client"} />
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "right", "bottom", "left"]}
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
