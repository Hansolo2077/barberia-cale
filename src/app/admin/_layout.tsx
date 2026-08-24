import { Redirect, Stack } from "expo-router";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/app-theme";

export default function AdminLayout() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View style={styles.container} accessibilityLiveRegion="polite">
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          accessibilityLabel="Cargando sesión"
        />

        <Text style={styles.text}>
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  if (user.role !== "ADMIN") {
    return <Redirect href="/client" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "bottom", "left"]}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  text: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
