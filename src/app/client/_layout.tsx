import {
  Redirect,
  Tabs,
} from "expo-router";

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

import AppIcon from "../../components/AppIcon";

import {
  COLORS,
  FONT,
} from "../../constants/app-theme";

export default function ClientLayout() {
  const insets =
    useSafeAreaInsets();

  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          accessibilityLabel="Cargando sesión"
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
    !user
  ) {
    return <Redirect href="/auth/login" />;
  }

  if (user.role !== "CLIENT") {
    return <Redirect href="/admin" />;
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
          COLORS.primary,

        tabBarInactiveTintColor:
          COLORS.textSecondary,

        tabBarStyle: {
          backgroundColor:
            COLORS.surface,

          borderTopColor:
            COLORS.accentSoft,

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
            <AppIcon
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              size={21}
              color={color}
            />
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
            <AppIcon
              name={{
                ios: "scissors",
                android: "content_cut",
                web: "content_cut",
              }}
              size={21}
              color={color}
            />
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
            <AppIcon
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              size={21}
              color={color}
            />
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
