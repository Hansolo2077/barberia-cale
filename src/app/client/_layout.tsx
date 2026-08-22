import {
  Tabs,
  useRouter,
} from "expo-router";

import {
  useEffect,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

import {
  COLORS,
  FONT,
} from "../../constants/app-theme";

export default function ClientLayout() {
  const router =
    useRouter();

  const insets =
    useSafeAreaInsets();

    console.log(
  "ANDROID SAFE AREA:",
  insets
);

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(
        "/auth/login"
      );

      return;
    }

    if (
      user.role ===
      "ADMIN"
    ) {
      router.replace(
        "/admin"
      );
    }
  }, [
    loading,
    user,
    router,
  ]);

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.text
          }
        >
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (
    !user ||
    user.role !==
      "CLIENT"
  ) {
    return null;
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "right", "left"]}
    >
      <Tabs
        screenOptions={{
        headerShown:
          false,

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

          height:
            60 +
            Math.max(
              insets.bottom,
              8
            ),

          paddingTop: 8,

          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),
        },

        tabBarLabelStyle: {
          fontSize:
            FONT.caption,

          fontWeight:
            "700",
        },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title:
            "Inicio",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize:
                  20,

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
          title:
            "Agendar",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize:
                  20,

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
          title:
            "Mis citas",

          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize:
                  19,

                color,
              }}
            >
              ≡
            </Text>
          ),
        }}
      />
      </Tabs>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    container: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      backgroundColor:
        COLORS.background,
    },

    text: {
      marginTop: 12,

      fontSize:
        FONT.small,

      color:
        COLORS.textSecondary,
    },
  });
