import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  AppState,
  Platform,
} from "react-native";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiError } from "../api/api-client";
import { confirmAttendance } from "../api/appointments.api";
import {
  deactivateNotificationDevice,
  registerNotificationDevice,
  type NotificationDevicePlatform,
} from "../api/notifications.api";
import { showMessage } from "../utils/show-message";
import { useAuth } from "./AuthContext";

const CHANNEL_ID = "appointment-reminders-v1";
const CATEGORY_ID = "attendance_reminder";
const CONFIRM_ACTION_ID = "confirm_attendance";
const PENDING_INTENT_KEY = "barberia_cale_notification_intent";
const INTENT_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
const NOTIFICATIONS_SUPPORTED =
  Platform.OS === "android" && !isRunningInExpoGo();

type NotificationsModule = typeof import("expo-notifications");
type NotificationResponse =
  import("expo-notifications").NotificationResponse;

let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let notificationPresentationPromise: Promise<NotificationsModule> | null =
  null;

type PermissionStatus =
  | "undetermined"
  | "denied"
  | "granted"
  | "unsupported";

export type NotificationRegistrationStatus =
  | "unregistered"
  | "registering"
  | "registered"
  | "failed"
  | "unsupported";

type NotificationIntent = {
  appointmentId: number;
  confirmAttendance: boolean;
  createdAt: number;
};

type RegisteredDevice = {
  authToken: string;
  userId: number;
  expoPushToken: string;
  platform: NotificationDevicePlatform;
};

type RegistrationInFlight = {
  authToken: string;
  userId: number;
  promise: Promise<boolean>;
};

type NotificationContextValue = {
  permissionStatus: PermissionStatus;
  registrationStatus: NotificationRegistrationStatus;
  notificationsReady: boolean;
  isSupported: boolean;
  isRegistering: boolean;
  enableNotifications: () => Promise<boolean>;
  refreshNotificationPermission: () => Promise<PermissionStatus>;
};

const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

function loadNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) {
    return Promise.resolve<NotificationsModule | null>(null);
  }

  notificationsModulePromise ??= import("expo-notifications").catch(
    (error) => {
      notificationsModulePromise = null;
      throw error;
    }
  );
  return notificationsModulePromise;
}

function parseAppointmentId(value: unknown) {
  const appointmentId =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN;

  return Number.isSafeInteger(appointmentId) && appointmentId > 0
    ? appointmentId
    : null;
}

function getIntentFromResponse(
  response: NotificationResponse
): NotificationIntent | null {
  const data = response.notification.request.content.data;

  if (
    !data ||
    data.kind !== "appointment_reminder" ||
    (data.version !== 1 && data.version !== "1")
  ) {
    return null;
  }

  const appointmentId = parseAppointmentId(data.appointmentId);

  if (!appointmentId) {
    return null;
  }

  return {
    appointmentId,
    confirmAttendance: response.actionIdentifier === CONFIRM_ACTION_ID,
    createdAt: Date.now(),
  };
}

function parseStoredIntent(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<NotificationIntent>;
    const appointmentId = parseAppointmentId(parsed.appointmentId);

    if (
      !appointmentId ||
      typeof parsed.confirmAttendance !== "boolean" ||
      typeof parsed.createdAt !== "number" ||
      !Number.isFinite(parsed.createdAt) ||
      Date.now() - parsed.createdAt > INTENT_MAX_AGE_MS
    ) {
      return null;
    }

    return {
      appointmentId,
      confirmAttendance: parsed.confirmAttendance,
      createdAt: parsed.createdAt,
    } satisfies NotificationIntent;
  } catch {
    return null;
  }
}

function getProjectId() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  return typeof projectId === "string" && projectId.trim()
    ? projectId.trim()
    : null;
}

async function configureNotificationPresentation() {
  if (!NOTIFICATIONS_SUPPORTED) {
    return null;
  }

  notificationPresentationPromise ??= (async () => {
    const Notifications = await loadNotifications();

    if (!Notifications) {
      throw new Error("Las notificaciones no están disponibles.");
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Recordatorios de citas",
      description:
        "Avisos para confirmar la asistencia a tus próximas citas.",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 200, 250],
      lightColor: "#743B2F",
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PRIVATE,
    });

    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: CONFIRM_ACTION_ID,
        buttonTitle: "Confirmar asistencia",
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    return Notifications;
  })().catch((error) => {
    notificationPresentationPromise = null;
    throw error;
  });

  return notificationPresentationPromise;
}

export function NotificationProvider({
  children,
}: PropsWithChildren) {
  const router = useRouter();
  const {
    user,
    token,
    loading: authLoading,
  } = useAuth();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>(
      NOTIFICATIONS_SUPPORTED ? "undetermined" : "unsupported"
    );
  const [registrationStatus, setRegistrationStatus] =
    useState<NotificationRegistrationStatus>(
      NOTIFICATIONS_SUPPORTED ? "unregistered" : "unsupported"
    );
  const [notificationsReady, setNotificationsReady] =
    useState(!NOTIFICATIONS_SUPPORTED);
  const [isRegistering, setIsRegistering] = useState(false);
  const expoPushTokenRef = useRef<string | null>(null);
  const registeredDeviceRef = useRef<RegisteredDevice | null>(null);
  const registrationPromiseRef = useRef<RegistrationInFlight | null>(null);
  const authIdentityRef = useRef({
    authToken: token,
    userId: user?.id ?? null,
    role: user?.role ?? null,
  });
  const processingIntentRef = useRef(false);
  const handledResponsesRef = useRef(new Set<string>());

  useEffect(() => {
    authIdentityRef.current = {
      authToken: token,
      userId: user?.id ?? null,
      role: user?.role ?? null,
    };
  }, [token, user?.id, user?.role]);

  const refreshNotificationPermission = useCallback(async () => {
    if (!NOTIFICATIONS_SUPPORTED) {
      setPermissionStatus("unsupported");
      setNotificationsReady(true);
      return "unsupported" as const;
    }

    try {
      const Notifications = await configureNotificationPresentation();

      if (!Notifications) {
        setPermissionStatus("unsupported");
        setNotificationsReady(true);
        return "unsupported" as const;
      }

      const permission = await Notifications.getPermissionsAsync();
      setPermissionStatus(permission.status);
      setNotificationsReady(true);
      return permission.status;
    } catch (error) {
      console.warn("No se pudo consultar el permiso de notificaciones:", error);
      setNotificationsReady(true);
      return "undetermined" as const;
    }
  }, []);

  const registerCurrentDevice = useCallback(
    async (
      requestPermission: boolean,
      forceTokenRefresh = false
    ) => {
      if (
        !NOTIFICATIONS_SUPPORTED ||
        !token ||
        user?.role !== "CLIENT"
      ) {
        return false;
      }

      const currentRegistration = registrationPromiseRef.current;

      if (currentRegistration) {
        const currentResult = await currentRegistration.promise;

        if (
          !forceTokenRefresh &&
          currentRegistration.authToken === token &&
          currentRegistration.userId === user.id
        ) {
          return currentResult;
        }
      }

      const nextRegistration = registrationPromiseRef.current;

      if (nextRegistration) {
        const nextResult = await nextRegistration.promise;

        if (
          !forceTokenRefresh &&
          nextRegistration.authToken === token &&
          nextRegistration.userId === user.id
        ) {
          return nextResult;
        }
      }

      if (forceTokenRefresh) {
        expoPushTokenRef.current = null;
      }

      const registration = (async () => {
        setIsRegistering(true);
        setRegistrationStatus("registering");

        try {
          const Notifications =
            await configureNotificationPresentation();

          if (!Notifications) {
            setPermissionStatus("unsupported");
            setRegistrationStatus("unsupported");
            return false;
          }

          let permission = await Notifications.getPermissionsAsync();

          if (permission.status !== "granted" && requestPermission) {
            permission = await Notifications.requestPermissionsAsync();
          }

          setPermissionStatus(permission.status);
          setNotificationsReady(true);

          if (permission.status !== "granted") {
            setRegistrationStatus("unregistered");
            return false;
          }

          const registeredDevice = registeredDeviceRef.current;

          if (
            !forceTokenRefresh &&
            registeredDevice?.authToken === token &&
            registeredDevice.userId === user.id
          ) {
            setRegistrationStatus("registered");
            return true;
          }

          const projectId = getProjectId();

          if (!projectId) {
            throw new Error(
              "No encontramos la configuración EAS de las notificaciones."
            );
          }

          const expoPushToken =
            expoPushTokenRef.current ??
            (
              await Notifications.getExpoPushTokenAsync({
                projectId,
              })
            ).data;

          expoPushTokenRef.current = expoPushToken;

          await registerNotificationDevice(token, {
            expoPushToken,
            platform: "android",
          });

          const currentIdentity = authIdentityRef.current;

          if (
            currentIdentity.authToken !== token ||
            currentIdentity.userId !== user.id ||
            currentIdentity.role !== "CLIENT"
          ) {
            void deactivateNotificationDevice(token, {
              expoPushToken,
              platform: "android",
            }).catch(() => {
              // La limpieza posterior del servidor retirara tokens obsoletos.
            });
            setRegistrationStatus("unregistered");
            return false;
          }

          const previousDevice = registeredDeviceRef.current;

          registeredDeviceRef.current = {
            authToken: token,
            userId: user.id,
            expoPushToken,
            platform: "android",
          };
          setRegistrationStatus("registered");

          if (
            previousDevice &&
            (previousDevice.authToken !== token ||
              previousDevice.userId !== user.id ||
              previousDevice.expoPushToken !== expoPushToken)
          ) {
            void deactivateNotificationDevice(previousDevice.authToken, {
              expoPushToken: previousDevice.expoPushToken,
              platform: previousDevice.platform,
            }).catch(() => {
              // El backend desactivará también tokens inválidos al procesar recibos.
            });
          }

          return true;
        } catch (error) {
          console.warn("No se pudo registrar el dispositivo push:", error);
          setNotificationsReady(true);
          setRegistrationStatus("failed");
          return false;
        } finally {
          setIsRegistering(false);
        }
      })();

      registrationPromiseRef.current = {
        authToken: token,
        userId: user.id,
        promise: registration,
      };
      void registration.finally(() => {
        if (registrationPromiseRef.current?.promise === registration) {
          registrationPromiseRef.current = null;
        }
      });
      return registration;
    },
    [token, user]
  );

  const enableNotifications = useCallback(
    () => registerCurrentDevice(true),
    [registerCurrentDevice]
  );

  const processStoredIntent = useCallback(async () => {
    if (processingIntentRef.current || authLoading) {
      return;
    }

    processingIntentRef.current = true;

    try {
      const serialized = await AsyncStorage.getItem(PENDING_INTENT_KEY);
      const intent = parseStoredIntent(serialized);

      if (!intent) {
        if (serialized) {
          await AsyncStorage.removeItem(PENDING_INTENT_KEY);
        }
        return;
      }

      if (!token || !user) {
        router.replace("/auth/login");
        return;
      }

      if (user.role !== "CLIENT") {
        showMessage(
          "Se necesita una cuenta de cliente",
          "Abre esta notificación con la cuenta que reservó la cita.",
          { kind: "info" }
        );
        return;
      }

      router.push({
        pathname: "/client/my-appointments",
        params: {
          appointmentId: String(intent.appointmentId),
          intent: "attendance",
        },
      });

      if (!intent.confirmAttendance) {
        await AsyncStorage.removeItem(PENDING_INTENT_KEY);
        return;
      }

      try {
        await confirmAttendance(token, intent.appointmentId);
        await AsyncStorage.removeItem(PENDING_INTENT_KEY);
        showMessage(
          "Asistencia confirmada",
          "Gracias por avisarnos. Te esperamos en Barbería Cale.",
          { kind: "success" }
        );
      } catch (error) {
        const isFinalRejection =
          error instanceof ApiError &&
          (error.status === 400 ||
            error.status === 403 ||
            error.status === 404 ||
            error.status === 409);

        if (isFinalRejection) {
          await AsyncStorage.removeItem(PENDING_INTENT_KEY);
        }

        if (!(error instanceof ApiError && error.status === 401)) {
          showMessage(
            "No se pudo confirmar la asistencia",
            error instanceof Error
              ? error.message
              : "Abre la cita e inténtalo nuevamente.",
            { kind: "error" }
          );
        }
      }
    } finally {
      processingIntentRef.current = false;
    }
  }, [authLoading, router, token, user]);

  const handleNotificationResponse = useCallback(
    async (response: NotificationResponse) => {
      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;

      if (handledResponsesRef.current.has(responseKey)) {
        return;
      }

      const intent = getIntentFromResponse(response);

      if (!intent) {
        return;
      }

      handledResponsesRef.current.add(responseKey);
      await AsyncStorage.setItem(
        PENDING_INTENT_KEY,
        JSON.stringify(intent)
      );

      if (!authLoading) {
        await processStoredIntent();
      }
    },
    [authLoading, processStoredIntent]
  );

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) {
      return;
    }

    let active = true;
    let responseSubscription: { remove: () => void } | null = null;

    void configureNotificationPresentation()
      .then(async (Notifications) => {
        if (!Notifications || !active) {
          return;
        }

        responseSubscription =
          Notifications.addNotificationResponseReceivedListener(
            (response) => {
              void handleNotificationResponse(response);
            }
          );

        const lastResponse =
          Notifications.getLastNotificationResponse();

        if (lastResponse) {
          void handleNotificationResponse(lastResponse);
          Notifications.clearLastNotificationResponse();
        }

        const permission = await Notifications.getPermissionsAsync();

        if (!active) {
          return;
        }

        setPermissionStatus(permission.status);
        setNotificationsReady(true);

        if (permission.status !== "granted") {
          setRegistrationStatus("unregistered");
        }
      })
      .catch((error) => {
        console.warn("No se pudo preparar el canal de recordatorios:", error);
        setNotificationsReady(true);
        setRegistrationStatus("failed");
      });

    return () => {
      active = false;
      responseSubscription?.remove();
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) {
      return;
    }

    let active = true;
    let pushTokenSubscription: { remove: () => void } | null = null;

    void loadNotifications()
      .then((Notifications) => {
        if (!Notifications || !active) {
          return;
        }

        pushTokenSubscription = Notifications.addPushTokenListener(() => {
          expoPushTokenRef.current = null;

          if (!authLoading && token && user?.role === "CLIENT") {
            void registerCurrentDevice(false, true);
          }
        });
      })
      .catch((error) => {
        console.warn("No se pudo escuchar la rotación del token push:", error);
      });

    return () => {
      active = false;
      pushTokenSubscription?.remove();
    };
  }, [authLoading, registerCurrentDevice, token, user?.role]);

  useEffect(() => {
    if (
      NOTIFICATIONS_SUPPORTED &&
      !authLoading &&
      token &&
      user?.role === "CLIENT" &&
      permissionStatus === "granted"
    ) {
      void registerCurrentDevice(false);
    }
  }, [
    authLoading,
    permissionStatus,
    registerCurrentDevice,
    token,
    user,
  ]);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) {
      return;
    }

    let active = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadNotifications()
          .then(async (Notifications) => {
            if (!Notifications || !active) {
              return;
            }

            const permission =
              await Notifications.getPermissionsAsync();

            if (!active) {
              return;
            }

            setPermissionStatus(permission.status);

            if (permission.status === "granted") {
              void registerCurrentDevice(false);
            } else {
              setRegistrationStatus("unregistered");
            }
          })
          .catch((error) => {
            console.warn(
              "No se pudo consultar el permiso de notificaciones:",
              error
            );
          });
        void processStoredIntent();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [processStoredIntent, registerCurrentDevice]);

  useEffect(() => {
    const registered = registeredDeviceRef.current;

    if (
      !registered ||
      (registered.authToken === token && registered.userId === user?.id)
    ) {
      return;
    }

    registeredDeviceRef.current = null;
    setRegistrationStatus(
      NOTIFICATIONS_SUPPORTED ? "unregistered" : "unsupported"
    );
    void deactivateNotificationDevice(registered.authToken, {
      expoPushToken: registered.expoPushToken,
      platform: registered.platform,
    }).catch(() => {
      // Cerrar sesión debe seguir funcionando aunque el dispositivo esté sin red.
    });
  }, [token, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      void processStoredIntent();
    }
  }, [authLoading, processStoredIntent, token, user]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      permissionStatus,
      registrationStatus,
      notificationsReady,
      isSupported: NOTIFICATIONS_SUPPORTED,
      isRegistering,
      enableNotifications,
      refreshNotificationPermission,
    }),
    [
      enableNotifications,
      isRegistering,
      notificationsReady,
      permissionStatus,
      refreshNotificationPermission,
      registrationStatus,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications debe utilizarse dentro de NotificationProvider."
    );
  }

  return context;
}
