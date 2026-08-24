import {
    useFocusEffect,
    useRouter,
} from "expo-router";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { showMessage } from "../../utils/show-message";
import { BUSINESS } from "../../constants/business";
import {
  isAppointmentPast,
  isAtLeastMinutesBeforeAppointment,
} from "../../utils/business-date";



import {
    cancelAppointment,
    confirmAttendance,
    getMyAppointments,
} from "../../api/appointments.api";
import { ApiError } from "../../api/api-client";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";

type Appointment = {
  id: number;
  service: string;
  date: string;
  time: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";
  createdAt: string;
  clientAttendanceConfirmedAt: string | null;
  attendanceStatus:
    | "CONFIRMED"
    | "AWAITING"
    | "NO_RESPONSE"
    | "NOT_APPLICABLE";
  canConfirmAttendance: boolean;
  cancelUntil?: string;
  canCancel?: boolean;
  isPast?: boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type AppointmentView =
  | "UPCOMING"
  | "HISTORY";

type LoadMode = "refresh" | "more" | "background";

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.code === "UNAUTHORIZED";
}

function appointmentDateTimeKey(appointment: Appointment) {
  return `${appointment.date}T${appointment.time.slice(0, 5)}`;
}

function getCancellationDeadline(appointment: Appointment) {
  const [year, month, day] = appointment.date
    .split("-")
    .map(Number);
  const [hour, minute] = appointment.time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute - BUSINESS.bookingPolicy.cancellationWindowMinutes
    )
  );
}

function formatCancellationDeadline(appointment: Appointment) {
  return new Intl.DateTimeFormat(BUSINESS.locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(getCancellationDeadline(appointment));
}

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    permissionStatus,
    registrationStatus,
    registrationStage,
    registrationError,
    isSupported: notificationsSupported,
    isRegistering: registeringNotifications,
    enableNotifications,
  } = useNotifications();

  const notificationActivationLabel =
    registrationStage === "permission"
      ? "Esperando permiso..."
      : registrationStage === "device"
        ? "Preparando teléfono..."
        : registrationStage === "expo"
          ? "Conectando recordatorios..."
          : registrationStage === "server"
            ? "Guardando activación..."
            : "Activando...";

  const [
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>([]);

  const [
    selectedView,
    setSelectedView,
  ] =
    useState<AppointmentView>(
      "UPCOMING"
    );

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 1,
      hasMore: false,
    });

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<number | null>(null);

  const cancellationInFlightRef = useRef<number | null>(null);

  const [confirmingAttendanceId, setConfirmingAttendanceId] =
    useState<number | null>(null);

  const attendanceConfirmationInFlightRef =
    useRef<number | null>(null);

  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  const loadRequestRef = useRef(0);
  const loadModeRef = useRef<{
    requestId: number;
    mode: LoadMode;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  const loadAppointments = useCallback(async (
    page = 1,
    mode: LoadMode = "refresh"
  ) => {
    if (!token) {
      return;
    }

    // Las acciones visibles se serializan. Una reconciliación de fondo puede
    // reemplazar una lectura anterior porque refleja una mutación más reciente.
    if (
      mode !== "background" &&
      loadModeRef.current &&
      loadModeRef.current.mode !== "background"
    ) {
      return;
    }

    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    loadModeRef.current = { requestId, mode };

    try {
      if (mode === "refresh") {
        setRefreshing(true);
      } else if (mode === "more") {
        setLoadingMore(true);
      }

      setError("");

      const result =
        await getMyAppointments(
          token,
          {
            page,
            pageSize: 100,
          }
        );

      const incoming = (result.appointments ?? []) as Appointment[];

      if (requestId !== loadRequestRef.current) {
        return;
      }

      setAppointments((current) => {
        if (page === 1) {
          return incoming;
        }

        const byId = new Map(
          [...current, ...incoming].map((appointment) => [
            appointment.id,
            appointment,
          ])
        );

        return [...byId.values()];
      });

      setPagination(
        result.pagination ?? {
          page,
          pageSize: 100,
          total: incoming.length,
          totalPages: 1,
          hasMore: false,
        }
      );
      setLastUpdated(new Date());
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return;
      }

      if (isUnauthorizedError(error)) {
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar tus citas."
      );
    } finally {
      if (requestId === loadRequestRef.current) {
        loadModeRef.current = null;
        setInitialLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void loadAppointments(1, "refresh");
      }

      return () => {
        loadRequestRef.current += 1;
        loadModeRef.current = null;
      };
    }, [loadAppointments, token])
  );

  function getStatusText(
    status: Appointment["status"]
  ) {
    switch (status) {
      case "PENDING":
        return "Pendiente";

      case "ACCEPTED":
        return "Confirmada";

      case "COMPLETED":
        return "Completada";

      case "REJECTED":
        return "Rechazada";

      case "CANCELLED":
        return "Cancelada";

      default:
        return status;
    }
  }

  function getStatusStyle(
    status: Appointment["status"]
  ) {
    switch (status) {
      case "ACCEPTED":
        return {
          background:
            COLORS.successBackground,
          text:
            COLORS.success,
        };

      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            COLORS.warning,
        };

      case "COMPLETED":
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.text,
        };

      case "REJECTED":
      case "CANCELLED":
        return {
          background:
            COLORS.dangerBackground,
          text:
            COLORS.danger,
        };

      default:
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.textSecondary,
        };
    }
  }

  function confirmCancel(
    appointment: Appointment
  ) {
    if (
      cancellationInFlightRef.current !== null ||
      attendanceConfirmationInFlightRef.current !== null
    ) {
      return;
    }

    if (
      !isAtLeastMinutesBeforeAppointment(
        appointment.date,
        appointment.time,
        BUSINESS.bookingPolicy.cancellationWindowMinutes
      )
    ) {
      showMessage(
        "Ya no se puede cancelar",
        "Debes cancelar la cita con al menos una hora de anticipación.",
        { kind: "error" }
      );
      void loadAppointments(1, "background");
      return;
    }

    const message =
      `¿Deseas cancelar ${appointment.service} del ${formatDisplayDate(
        appointment.date
      )} a las ${formatDisplayTime(
        appointment.time
      )}? Tu plazo de cancelación termina ${formatCancellationDeadline(
        appointment
      )}. El horario quedará disponible para otro cliente.`;

    if (Platform.OS !== "web") {
      Alert.alert(
        "Cancelar cita",
        message,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: () =>
              handleCancel(
                appointment.id
              ),
          },
        ]
      );

      return;
    }

    if (
      typeof window.confirm === "function" &&
      window.confirm(message)
    ) {
      void handleCancel(appointment.id);
    }
  }

  async function handleCancel(
  appointmentId: number
) {
  if (
    !token ||
    cancellationInFlightRef.current !== null ||
    attendanceConfirmationInFlightRef.current !== null
  ) {
    return;
  }

  cancellationInFlightRef.current = appointmentId;

  try {
    setCancellingId(
      appointmentId
    );

    setError("");

    const result = await cancelAppointment(
      token,
      appointmentId
    );

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              ...(result.appointment ?? {}),
              status: "CANCELLED",
              canCancel: false,
            }
          : appointment
      )
    );

    showMessage(
      "Cita cancelada",
      "La cita fue cancelada correctamente."
    );

    void loadAppointments(1, "background");
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cancelar la cita.";

    showMessage(
      "No se pudo cancelar",
      message
    );

    // El servidor pudo completar la cancelación antes de un timeout o
    // rechazarla por un cambio de estado. Reconciliamos ambos escenarios.
    void loadAppointments(1, "background");
  } finally {
    if (cancellationInFlightRef.current === appointmentId) {
      cancellationInFlightRef.current = null;
    }

    setCancellingId((current) =>
      current === appointmentId ? null : current
    );
  }
}

  async function handleConfirmAttendance(
    appointmentId: number
  ) {
    if (
      !token ||
      attendanceConfirmationInFlightRef.current !== null ||
      cancellationInFlightRef.current !== null
    ) {
      return;
    }

    attendanceConfirmationInFlightRef.current = appointmentId;
    setConfirmingAttendanceId(appointmentId);

    try {
      setError("");

      const result = await confirmAttendance(token, appointmentId);

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                ...(result.appointment ?? {}),
                attendanceStatus: "CONFIRMED",
                canConfirmAttendance: false,
              }
            : appointment
        )
      );

      showMessage(
        "Asistencia confirmada",
        "Gracias por avisarnos. Te esperamos en Barbería Cale.",
        { kind: "success" }
      );

      void loadAppointments(1, "background");
    } catch (confirmationError) {
      if (isUnauthorizedError(confirmationError)) {
        return;
      }

      showMessage(
        "No se pudo confirmar la asistencia",
        confirmationError instanceof Error
          ? confirmationError.message
          : "Inténtalo nuevamente en unos momentos.",
        { kind: "error" }
      );

      // La respuesta pudo aplicarse antes de un timeout. Reconciliamos con
      // el servidor para mantener la acción idempotente y evitar otro toque.
      void loadAppointments(1, "background");
    } finally {
      if (
        attendanceConfirmationInFlightRef.current === appointmentId
      ) {
        attendanceConfirmationInFlightRef.current = null;
      }

      setConfirmingAttendanceId((current) =>
        current === appointmentId ? null : current
      );
    }
  }

  async function handleEnableReminders() {
    if (!notificationsSupported || registeringNotifications) {
      return;
    }

    const result = await enableNotifications();

    if (result.enabled) {
      showMessage(
        "Recordatorios activados",
        "Te avisaremos sobre las citas que necesiten tu confirmación.",
        { kind: "success" }
      );
      return;
    }

    showMessage(
      "No pudimos activar los recordatorios",
      permissionStatus === "denied"
        ? "Permite las notificaciones desde los ajustes de tu dispositivo e inténtalo nuevamente."
        : result.error ?? registrationError ??
          "Revisa tu conexión e inténtalo nuevamente. Tus citas siguen guardadas.",
      { kind: "info" }
    );
  }

  const isPast = (appointment: Appointment) =>
    appointment.isPast === true ||
    isAppointmentPast(
      appointment.date,
      appointment.time,
      new Date(currentTime)
    );

  const upcomingAppointments =
    appointments
      .filter(
        (appointment) =>
          (appointment.status === "PENDING" ||
            appointment.status === "ACCEPTED") &&
          !isPast(appointment)
      )
      .sort((a, b) =>
        appointmentDateTimeKey(a).localeCompare(appointmentDateTimeKey(b))
      );

  const historyAppointments =
    appointments
      .filter(
        (appointment) =>
          appointment.status === "COMPLETED" ||
          appointment.status === "REJECTED" ||
          appointment.status === "CANCELLED" ||
          isPast(appointment)
      )
      .sort((a, b) =>
        appointmentDateTimeKey(b).localeCompare(appointmentDateTimeKey(a))
      );

  const shouldOfferReminders =
    notificationsSupported &&
    selectedView === "UPCOMING" &&
    upcomingAppointments.length > 0 &&
    registrationStatus !== "registered";

  const visibleAppointments =
    selectedView === "UPCOMING"
      ? upcomingAppointments
      : historyAppointments;

  const listBusy = refreshing || loadingMore;

  if (initialLoading && appointments.length === 0) {
    return (
      <View
        style={
          styles.centerContainer
        }
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Cargando tus citas"
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Cargando tus citas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadAppointments(1, "refresh")}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAccent} />

          <Text style={styles.eyebrow}>
            TU AGENDA
          </Text>

          <Text style={styles.title} accessibilityRole="header">
            Mis citas
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Consulta tus próximas
            reservas y el historial de
            citas anteriores.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <BackButton
            iconOnly
            fallbackHref="/client"
          />

          <Pressable
            style={styles.refreshButton}
            disabled={listBusy}
            accessibilityRole="button"
            accessibilityLabel="Actualizar mis citas"
            accessibilityState={{ disabled: listBusy, busy: listBusy }}
            onPress={() => void loadAppointments(1, "refresh")}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <AppIcon
                name={{
                  ios: "arrow.clockwise",
                  android: "refresh",
                  web: "refresh",
                }}
                size={20}
                color={COLORS.primary}
              />
            )}
          </Pressable>
        </View>
      </View>

      {lastUpdated ? (
        <Text style={styles.lastUpdatedText} accessibilityLiveRegion="polite">
          Actualizado a las {new Intl.DateTimeFormat(BUSINESS.locale, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).format(lastUpdated)}
        </Text>
      ) : null}

      <View
        style={
          styles.tabsContainer
        }
      >
        <Pressable
          style={[
            styles.tabButton,

            selectedView ===
              "UPCOMING" &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            setSelectedView(
              "UPCOMING"
            )
          }
          accessibilityRole="tab"
          accessibilityLabel={`Próximas, ${upcomingAppointments.length}`}
          accessibilityState={{
            selected:
              selectedView === "UPCOMING",
          }}
        >
          <Text
            style={[
              styles.tabText,

              selectedView ===
                "UPCOMING" &&
                styles.activeTabText,
            ]}
          >
            Próximas
          </Text>

          {upcomingAppointments.length >
            0 && (
            <View
              style={[
                styles.countBadge,

                selectedView ===
                  "UPCOMING" &&
                  styles.activeCountBadge,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,

                  selectedView ===
                    "UPCOMING" &&
                    styles.activeCountBadgeText,
                ]}
              >
                {
                  upcomingAppointments.length
                }
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,

            selectedView ===
              "HISTORY" &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            setSelectedView(
              "HISTORY"
            )
          }
          accessibilityRole="tab"
          accessibilityLabel={`Historial, ${historyAppointments.length}`}
          accessibilityState={{
            selected:
              selectedView === "HISTORY",
          }}
        >
          <Text
            style={[
              styles.tabText,

              selectedView ===
                "HISTORY" &&
                styles.activeTabText,
            ]}
          >
            Historial
          </Text>
        </Pressable>
      </View>

      {shouldOfferReminders && (
        <View style={styles.remindersOptInCard}>
          <View style={styles.remindersOptInIcon}>
            <AppIcon
              name={{
                ios: "bell",
                android: "notifications_none",
                web: "notifications_none",
              }}
              size={21}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.remindersOptInContent}>
            <Text style={styles.remindersOptInTitle}>
              Recibe el recordatorio de tu cita
            </Text>
            <Text style={styles.remindersOptInText}>
              Te avisaremos una hora antes para que puedas confirmar tu asistencia.
            </Text>

            {registrationStatus === "failed" && registrationError ? (
              <Text
                style={styles.remindersOptInError}
                accessibilityRole="alert"
              >
                {registrationError}
              </Text>
            ) : null}

            <Pressable
              style={[
                styles.remindersOptInButton,
                registeringNotifications && styles.disabledButton,
              ]}
              disabled={registeringNotifications}
              onPress={() => void handleEnableReminders()}
              accessibilityRole="button"
              accessibilityLabel="Activar recordatorios de citas"
              accessibilityState={{
                disabled: registeringNotifications,
                busy: registeringNotifications,
              }}
            >
              {registeringNotifications ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <AppIcon
                  name={{
                    ios: "bell.badge",
                    android: "notifications_active",
                    web: "notifications_active",
                  }}
                  size={17}
                  color={COLORS.primary}
                />
              )}
              <Text style={styles.remindersOptInButtonText}>
                {registeringNotifications
                  ? notificationActivationLabel
                  : registrationStatus === "failed"
                    ? "Reintentar activación"
                    : "Activar recordatorios"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {error && appointments.length > 0 ? (
        <View style={styles.inlineError} accessibilityRole="alert">
          <Text style={styles.inlineErrorText}>
            No pudimos actualizar la lista. Tus citas anteriores siguen visibles.
          </Text>
          <Pressable
            style={styles.inlineRetryButton}
            accessibilityRole="button"
            onPress={() => void loadAppointments(1, "refresh")}
          >
            <Text style={styles.inlineRetryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {error && appointments.length === 0 ? (
        <View
          style={
            styles.messageCard
          }
        >
          <Text
            style={
              styles.messageTitle
            }
          >
            No pudimos cargar tus citas
          </Text>

          <Text
            style={
              styles.messageText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            onPress={
              () => void loadAppointments(1, "refresh")
            }
            accessibilityRole="button"
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : visibleAppointments.length ===
        0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <AppIcon
              name={
                selectedView === "UPCOMING"
                  ? {
                      ios: "calendar.badge.plus",
                      android: "event_available",
                      web: "event_available",
                    }
                  : {
                      ios: "clock.arrow.circlepath",
                      android: "history",
                      web: "history",
                    }
              }
              size={28}
              color={COLORS.primary}
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            {selectedView ===
            "UPCOMING"
              ? "No tienes próximas citas"
              : "Tu historial está vacío"}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {selectedView ===
            "UPCOMING"
              ? "Cuando reserves tu próximo corte, aparecerá aquí."
              : "Las citas anteriores, completadas, rechazadas o canceladas aparecerán aquí."}
          </Text>

          {pagination.hasMore && (
            <Pressable
              style={styles.loadMoreButton}
              disabled={listBusy}
              accessibilityRole="button"
              accessibilityState={{ disabled: listBusy, busy: listBusy }}
              onPress={() => void loadAppointments(pagination.page + 1, "more")}
            >
              <Text style={styles.loadMoreButtonText}>
                {loadingMore ? "Cargando…" : "Buscar en más citas"}
              </Text>
            </Pressable>
          )}

          {selectedView ===
            "UPCOMING" && (
            <Pressable
              style={
                styles.primaryButton
              }
              onPress={() =>
                router.push(
                  "/client/appointment"
                )
              }
              accessibilityRole="button"
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Agendar una cita
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <Text
            style={
              styles.sectionTitle
            }
            accessibilityRole="header"
          >
            {selectedView ===
            "UPCOMING"
              ? "Próximas visitas"
              : "Visitas anteriores"}
          </Text>

          {visibleAppointments.map(
            (appointment) => {
              const statusStyle =
                getStatusStyle(
                  appointment.status
                );

              const hasCancellableStatus =
                appointment.status ===
                  "PENDING" ||
                appointment.status ===
                  "ACCEPTED";

              const appointmentIsPast =
                isPast(appointment);

              const cancellationExpired =
                !isAtLeastMinutesBeforeAppointment(
                  appointment.date,
                  appointment.time,
                  BUSINESS.bookingPolicy.cancellationWindowMinutes,
                  new Date(currentTime)
                ) ||
                appointment.canCancel === false;

              const canCancel =
                hasCancellableStatus &&
                !appointmentIsPast &&
                !cancellationExpired;

              const isCancelling =
                cancellingId ===
                appointment.id;

              const isConfirmingAttendance =
                confirmingAttendanceId === appointment.id;

              const appointmentActionInProgress =
                cancellingId !== null || confirmingAttendanceId !== null;

              const attendanceStatus =
                appointment.attendanceStatus ??
                (appointment.clientAttendanceConfirmedAt
                  ? "CONFIRMED"
                  : appointment.status === "ACCEPTED" && !appointmentIsPast
                    ? "AWAITING"
                    : "NOT_APPLICABLE");

              const canConfirmAttendance =
                appointment.status === "ACCEPTED" &&
                !appointmentIsPast &&
                attendanceStatus === "AWAITING" &&
                appointment.canConfirmAttendance !== false;

              return (
                <View
                  key={
                    appointment.id
                  }
                  style={[
                    styles.appointmentCard,
                    selectedView === "UPCOMING"
                      ? styles.upcomingCard
                      : styles.historyCard,
                  ]}
                >
                  <View
                    style={
                      styles.cardTopRow
                    }
                  >
                    <View style={styles.serviceIdentity}>
                      <View style={styles.serviceIcon}>
                        <AppIcon
                          name={{
                            ios: "scissors",
                            android: "content_cut",
                            web: "content_cut",
                          }}
                          size={21}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.serviceContent}>
                        <Text
                          style={
                            styles.serviceName
                          }
                        >
                          {
                            appointment.service
                          }
                        </Text>

                        <Text
                          style={
                            styles.serviceMeta
                          }
                        >
                          50 min · Barbería Cale
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            statusStyle.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              statusStyle.text,
                          },
                        ]}
                      >
                        {getStatusText(
                          appointment.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.bookingInfoRow
                    }
                  >
                    <View
                      style={[
                        styles.bookingInfoBlock,
                        selectedView === "HISTORY" &&
                          styles.historyInfoBlock,
                      ]}
                    >
                      <AppIcon
                        name={{
                          ios: "calendar",
                          android: "calendar_month",
                          web: "calendar_month",
                        }}
                        size={20}
                        color={COLORS.primary}
                      />

                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        Fecha
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {formatDisplayDate(
                          appointment.date
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.bookingInfoBlock,
                        selectedView === "HISTORY" &&
                          styles.historyInfoBlock,
                      ]}
                    >
                      <AppIcon
                        name={{
                          ios: "clock",
                          android: "schedule",
                          web: "schedule",
                        }}
                        size={20}
                        color={COLORS.primary}
                      />

                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        Hora
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {formatDisplayTime(
                          appointment.time
                        )}
                      </Text>
                    </View>
                  </View>

                  {canCancel && (
                    <Pressable
                      style={[
                        styles.cancelButton,

                        appointmentActionInProgress &&
                          styles.disabledButton,
                      ]}
                      disabled={
                        appointmentActionInProgress
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Cancelar cita de ${appointment.service}`}
                      accessibilityState={{
                        disabled: appointmentActionInProgress,
                        busy: isCancelling,
                      }}
                      onPress={() =>
                        confirmCancel(
                          appointment
                        )
                      }
                    >
                      <AppIcon
                        name={{
                          ios: "xmark",
                          android: "close",
                          web: "close",
                        }}
                        size={17}
                        color={COLORS.danger}
                      />

                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        {isCancelling
                          ? "Cancelando..."
                          : "Cancelar cita"}
                      </Text>
                    </Pressable>
                  )}

                  {canCancel && (
                    <View style={styles.cancellationDeadlineNotice}>
                      <AppIcon
                        name={{
                          ios: "info.circle",
                          android: "info",
                          web: "info",
                        }}
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.cancellationDeadlineText}>
                        Puedes cancelar hasta {formatCancellationDeadline(appointment)}, una hora antes de la cita.
                      </Text>
                    </View>
                  )}

                  {appointment.status ===
                    "PENDING" && !appointmentIsPast && (
                    <View
                      style={
                        styles.infoNotice
                      }
                    >
                      <AppIcon
                        name={{
                          ios: "clock",
                          android: "schedule",
                          web: "schedule",
                        }}
                        size={18}
                        color={COLORS.warning}
                      />

                      <Text
                        style={
                          styles.infoNoticeText
                        }
                      >
                        Esperando confirmación de la barbería.
                      </Text>
                    </View>
                  )}

                  {appointment.status ===
                    "ACCEPTED" &&
                    !appointmentIsPast &&
                    attendanceStatus !== "CONFIRMED" && (
                    <View
                      style={
                        styles.confirmedNotice
                      }
                    >
                      <AppIcon
                        name={{
                          ios: "checkmark.circle.fill",
                          android: "check_circle",
                          web: "check_circle",
                        }}
                        size={18}
                        color={COLORS.success}
                      />

                      <Text
                        style={
                          styles.confirmedNoticeText
                        }
                      >
                        Cita aceptada por la barbería.
                      </Text>
                    </View>
                  )}

                  {appointment.status === "ACCEPTED" &&
                    attendanceStatus === "CONFIRMED" && (
                      <View style={styles.confirmedNotice}>
                        <AppIcon
                          name={{
                            ios: "checkmark.seal.fill",
                            android: "verified",
                            web: "verified",
                          }}
                          size={18}
                          color={COLORS.success}
                        />

                        <Text style={styles.confirmedNoticeText}>
                          Asistencia confirmada. Te esperamos en Barbería Cale.
                        </Text>
                      </View>
                    )}

                  {canConfirmAttendance && (
                    <View style={styles.attendancePrompt}>
                      <Text style={styles.attendancePromptTitle}>
                        ¿Confirmas que asistirás?
                      </Text>

                      <Text style={styles.attendancePromptText}>
                        Tu respuesta ayuda a la barbería a preparar tu visita.
                      </Text>

                      <Pressable
                        style={[
                          styles.attendanceConfirmButton,
                          appointmentActionInProgress && styles.disabledButton,
                        ]}
                        disabled={appointmentActionInProgress}
                        onPress={() =>
                          void handleConfirmAttendance(appointment.id)
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Confirmar que asistiré a la cita"
                        accessibilityState={{
                          disabled: appointmentActionInProgress,
                          busy: isConfirmingAttendance,
                        }}
                      >
                        {isConfirmingAttendance ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.onPrimary}
                          />
                        ) : (
                          <AppIcon
                            name={{
                              ios: "checkmark",
                              android: "check",
                              web: "check",
                            }}
                            size={18}
                            color={COLORS.onPrimary}
                          />
                        )}

                        <Text style={styles.attendanceConfirmButtonText}>
                          {isConfirmingAttendance
                            ? "Confirmando..."
                            : "Confirmar asistencia"}
                        </Text>
                      </Pressable>

                    </View>
                  )}

                  {appointment.status === "ACCEPTED" &&
                    (attendanceStatus === "NO_RESPONSE" ||
                      (attendanceStatus === "AWAITING" &&
                        !canConfirmAttendance)) && (
                      <View style={styles.attendanceNeutralNotice}>
                        <AppIcon
                          name={{
                            ios: "minus.circle",
                            android: "remove_circle_outline",
                            web: "remove_circle_outline",
                          }}
                          size={18}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.attendanceNeutralText}>
                          No se recibió confirmación de asistencia.
                        </Text>
                      </View>
                    )}

                  {hasCancellableStatus &&
                    cancellationExpired &&
                    !appointmentIsPast && (
                    <View style={styles.expiredNotice}>
                      <AppIcon
                        name={{
                          ios: "info.circle",
                          android: "info",
                          web: "info",
                        }}
                        size={18}
                        color={COLORS.textSecondary}
                      />

                      <Text style={styles.expiredNoticeText}>
                        Ya no se puede cancelar: faltan menos de una hora para la cita.
                      </Text>
                    </View>
                  )}

                  {hasCancellableStatus && appointmentIsPast && (
                    <View style={styles.expiredNotice}>
                      <AppIcon
                        name={{
                          ios: "clock.badge.exclamationmark",
                          android: "pending_actions",
                          web: "pending_actions",
                        }}
                        size={18}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.expiredNoticeText}>
                        Esta cita ya pasó y está pendiente de cierre por la barbería.
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
          )}

          {pagination.hasMore && (
            <Pressable
              style={styles.loadMoreButton}
              disabled={listBusy}
              accessibilityRole="button"
              accessibilityLabel="Cargar más citas"
              accessibilityState={{ disabled: listBusy, busy: listBusy }}
              onPress={() => void loadAppointments(pagination.page + 1, "more")}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.loadMoreButtonText}>
                  Cargar más
                </Text>
              )}
            </Pressable>
          )}

          {selectedView ===
            "UPCOMING" && (
            <Pressable
              style={
                styles.newBookingButton
              }
              onPress={() =>
                router.push(
                  "/client/appointment"
                )
              }
              accessibilityRole="button"
            >
              <Text
                style={
                  styles.newBookingButtonText
                }
              >
                Agendar otra cita
              </Text>
            </Pressable>
          )}
        </>
      )}

      <BackButton fallbackHref="/client" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor:
      COLORS.background,
    paddingHorizontal:
      SPACING.lg,
    paddingTop:
      SPACING.xl,
    paddingBottom:
      SPACING.xxl,
  },

  centerContainer: {
    flex: 1,
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    marginTop:
      SPACING.sm,
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom:
      SPACING.lg,
  },

  headerContent: {
    flex: 1,
  },

  headerActions: {
    alignItems: "center",
    gap: SPACING.xs,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  lastUpdatedText: {
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    lineHeight: 18,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },

  inlineError: {
    backgroundColor: COLORS.dangerBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  inlineErrorText: {
    color: COLORS.danger,
    fontSize: FONT.small,
    lineHeight: 20,
  },

  inlineRetryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  inlineRetryText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  headerAccent: {
    width: 42,
    height: 3,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.accent,
    marginBottom:
      SPACING.md,
  },

  eyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.xs,
  },

  title: {
    fontSize:
      FONT.title,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "800",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  subtitle: {
    fontSize:
      FONT.body,
    lineHeight: 24,
    color:
      COLORS.textSecondary,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor:
      COLORS.primarySoft,
    borderRadius:
      RADIUS.pill,
    padding: 4,
    marginBottom:
      SPACING.xl,
  },

  remindersOptInCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.xl,
  },

  remindersOptInIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  remindersOptInContent: {
    flex: 1,
    minWidth: 0,
  },

  remindersOptInTitle: {
    color: COLORS.text,
    fontSize: FONT.small,
    lineHeight: 20,
    fontWeight: "800",
  },

  remindersOptInText: {
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    lineHeight: 18,
    marginTop: 2,
  },

  remindersOptInError: {
    color: COLORS.danger,
    fontSize: FONT.caption,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },

  remindersOptInButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },

  remindersOptInButtonText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius:
      RADIUS.pill,
    flexDirection: "row",
    justifyContent:
      "center",
    alignItems: "center",
    gap: SPACING.xs,
  },

  activeTabButton: {
    backgroundColor:
      COLORS.primary,
  },

  tabText: {
    fontSize:
      FONT.small,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  activeTabText: {
    color:
      COLORS.onPrimary,
  },

  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.border,
    justifyContent:
      "center",
    alignItems: "center",
  },

  activeCountBadge: {
    backgroundColor:
      COLORS.accentSoft,
  },

  countBadgeText: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  activeCountBadgeText: {
    color:
      COLORS.primary,
  },

  sectionTitle: {
    fontSize:
      FONT.subheading,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom:
      SPACING.md,
  },

  appointmentCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.md,
  },

  upcomingCard: {
    borderColor:
      COLORS.accentSoft,
  },

  historyCard: {
    backgroundColor:
      "rgba(255, 252, 247, 0.62)",
  },

  cardTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: SPACING.md,
    marginBottom:
      SPACING.md,
  },

  serviceIdentity: {
    flex: 1,
    flexBasis: 210,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight:
      SPACING.sm,
  },

  serviceContent: {
    flex: 1,
    minWidth: 0,
  },

  serviceName: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom: 3,
  },

  serviceMeta: {
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
  },

  statusBadge: {
    flexShrink: 0,
    borderRadius:
      RADIUS.pill,
    paddingHorizontal:
      SPACING.md,
    paddingVertical: 7,
  },

  statusText: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
  },

  bookingInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap:
      SPACING.sm,
  },

  bookingInfoBlock: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 0,
    backgroundColor:
      COLORS.primarySoft,
    borderRadius:
      RADIUS.lg,
    padding:
      SPACING.md,
  },

  historyInfoBlock: {
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  infoLabel: {
    fontSize:
      FONT.caption,
    color:
      COLORS.textSecondary,
    marginTop:
      SPACING.sm,
    marginBottom: 4,
  },

  infoValue: {
    fontSize:
      FONT.small,
    lineHeight: 19,
    fontWeight: "700",
    color:
      COLORS.text,
  },

  infoNotice: {
    backgroundColor:
      COLORS.warningBackground,
    borderRadius:
      RADIUS.md,
    paddingHorizontal:
      SPACING.sm,
    paddingVertical: 8,
    marginTop:
      SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  infoNoticeText: {
    flex: 1,
    color:
      COLORS.warning,
    fontSize:
      FONT.caption,
    lineHeight: 18,
  },

  confirmedNotice: {
    backgroundColor:
      COLORS.successBackground,
    borderRadius:
      RADIUS.md,
    paddingHorizontal:
      SPACING.sm,
    paddingVertical: 8,
    marginTop:
      SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  confirmedNoticeText: {
    flex: 1,
    color:
      COLORS.success,
    fontSize:
      FONT.caption,
    lineHeight: 18,
    fontWeight: "600",
  },

  attendancePrompt: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
  },

  attendancePromptTitle: {
    color: COLORS.text,
    fontSize: FONT.small,
    lineHeight: 20,
    fontWeight: "800",
  },

  attendancePromptText: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    lineHeight: 18,
  },

  attendanceConfirmButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
  },

  attendanceConfirmButtonText: {
    color: COLORS.onPrimary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  attendanceNeutralNotice: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },

  attendanceNeutralText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    lineHeight: 18,
    fontWeight: "600",
  },

  cancellationDeadlineNotice: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  cancellationDeadlineText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: FONT.caption,
    lineHeight: 18,
    fontWeight: "600",
  },

  cancelButton: {
    borderWidth: 1,
    borderColor:
      COLORS.danger,
    borderRadius:
      RADIUS.pill,
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal:
      SPACING.lg,
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop:
      SPACING.md,
    backgroundColor:
      COLORS.surface,
  },

  cancelButtonText: {
    color:
      COLORS.danger,
    fontSize:
      FONT.small,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

  expiredNotice: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor:
      COLORS.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  expiredNoticeText: {
    flex: 1,
    color:
      COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 20,
    fontWeight: "600",
  },

  newBookingButton: {
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop:
      SPACING.sm,
  },

  loadMoreButton: {
    width: "100%",
    maxWidth: 280,
    minHeight: 46,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },

  loadMoreButtonText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  newBookingButtonText: {
    color:
      COLORS.onPrimary,
    fontSize:
      FONT.body,
    fontWeight: "700",
  },

  messageCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.lg,
  },

  messageTitle: {
    fontSize:
      FONT.subheading,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  messageText: {
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop:
      SPACING.lg,
  },

  retryButtonText: {
    color:
      COLORS.onPrimary,
    fontSize:
      FONT.small,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.xl,
    borderWidth: 0,
    padding:
      SPACING.xl,
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primarySoft,
    justifyContent:
      "center",
    alignItems: "center",
    marginBottom:
      SPACING.md,
  },

  emptyTitle: {
    fontSize:
      FONT.heading,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
    textAlign: "center",
  },

  emptyText: {
    fontSize:
      FONT.body,
    lineHeight: 23,
    color:
      COLORS.textSecondary,
    textAlign: "center",
    marginBottom:
      SPACING.lg,
  },

  primaryButton: {
    width: "100%",
    maxWidth: 280,
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.pill,
    paddingVertical: 15,
    alignItems: "center",
  },

  primaryButtonText: {
    color:
      COLORS.onPrimary,
    fontSize:
      FONT.body,
    fontWeight: "700",
  },
});
