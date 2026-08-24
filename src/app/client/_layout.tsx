import {
  useEffect,
  useRef,
} from "react";

import {
  Redirect,
  Tabs,
} from "expo-router";

import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

import AppIcon from "../../components/AppIcon";
import { showMessage } from "../../utils/show-message";

import {
  COLORS,
  FONT,
} from "../../constants/app-theme";

export default function ClientLayout() {
  const insets =
    useSafeAreaInsets();

  const {
    user,
    token,
    loading,
  } = useAuth();

  const {
    permissionStatus,
    registrationStatus,
    notificationsReady,
    isSupported: notificationsSupported,
    isRegistering: registeringNotifications,
    enableNotifications,
    refreshNotificationPermission,
  } = useNotifications();

  const promptedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      promptedSessionRef.current = null;
    }
  }, [token]);

  useEffect(() => {
    if (
      loading ||
      !token ||
      user?.role !== "CLIENT" ||
      !notificationsSupported ||
      !notificationsReady ||
      registeringNotifications ||
      registrationStatus === "registered" ||
      (permissionStatus === "granted" &&
        registrationStatus !== "failed") ||
      promptedSessionRef.current === token
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      promptedSessionRef.current = token;
      const permissionDenied = permissionStatus === "denied";

      Alert.alert(
        "Activa los recordatorios",
        permissionDenied
          ? "Las notificaciones están desactivadas para Barbería Cale. Ábrelas en los ajustes para recibir avisos y confirmar tu asistencia."
          : "Recibe avisos de tus citas y confirma tu asistencia directamente desde la notificación. Puedes cambiar esta opción después.",
        [
          {
            text: "Ahora no",
            style: "cancel",
          },
          {
            text: permissionDenied
              ? "Abrir ajustes"
              : registrationStatus === "failed"
                ? "Reintentar"
                : "Activar",
            onPress: () => {
              if (permissionDenied) {
                void Linking.openSettings().catch(() => {
                  showMessage(
                    "No se pudieron abrir los ajustes",
                    "Abre los ajustes de Android y permite las notificaciones para Barbería Cale.",
                    { kind: "info" }
                  );
                });
                return;
              }

              void (async () => {
                const enabled = await enableNotifications();

                if (enabled) {
                  showMessage(
                    "Recordatorios activados",
                    "Te avisaremos sobre las citas que necesiten tu confirmación.",
                    { kind: "success" }
                  );
                  return;
                }

                const latestPermission =
                  await refreshNotificationPermission();

                if (latestPermission === "denied") {
                  Alert.alert(
                    "Permiso desactivado",
                    "Para recibir recordatorios, permite las notificaciones de Barbería Cale desde los ajustes de Android.",
                    [
                      {
                        text: "Ahora no",
                        style: "cancel",
                      },
                      {
                        text: "Abrir ajustes",
                        onPress: () => {
                          void Linking.openSettings().catch(() => {
                            showMessage(
                              "No se pudieron abrir los ajustes",
                              "Abre los ajustes de Android y permite las notificaciones para Barbería Cale.",
                              { kind: "info" }
                            );
                          });
                        },
                      },
                    ]
                  );
                  return;
                }

                showMessage(
                  "No pudimos activar los recordatorios",
                  "Puedes intentarlo nuevamente desde Inicio o Mis citas.",
                  { kind: "info" }
                );
              })();
            },
          },
        ]
      );
    }, 650);

    return () => clearTimeout(timeout);
  }, [
    enableNotifications,
    loading,
    notificationsReady,
    notificationsSupported,
    permissionStatus,
    registeringNotifications,
    registrationStatus,
    refreshNotificationPermission,
    token,
    user?.role,
  ]);

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
