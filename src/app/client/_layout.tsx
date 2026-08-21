import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

import {
    COLORS,
    FONT,
} from "../../constants/app-theme";

export default function ClientLayout() {
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

    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [
    loading,
    user,
    router,
  ]);

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

  if (
    !user ||
    user.role !== "CLIENT"
  ) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          COLORS.text,

        tabBarInactiveTintColor:
          COLORS.textMuted,

        tabBarStyle: {
          backgroundColor:
            COLORS.surface,

          borderTopColor:
            COLORS.border,

          borderTopWidth: 1,

          height: 68,

          paddingTop: 8,

          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize:
            FONT.caption,

          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 20,
                color,
              }}
            >
              ⌂
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="appointment"
        options={{
          title: "Agendar",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 20,
                color,
              }}
            >
              +
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="my-appointments"
        options={{
          title: "Mis citas",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 19,
                color,
              }}
            >
              ≡
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      COLORS.background,
  },

  text: {
    marginTop: 12,
    fontSize: FONT.small,
    color:
      COLORS.textSecondary,
  },
});